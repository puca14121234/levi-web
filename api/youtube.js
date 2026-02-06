import { Redis } from '@upstash/redis'
import axios from 'axios'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const API_KEY = process.env.VITE_YOUTUBE_API_KEY
const CHANNEL_ID = 'UClbFnMu72DbIvh6aZebAHsA'
const UPLOADS_PLAYLIST_ID = 'UUlbFnMu72DbIvh6aZebAHsA'

const youtubeApi = axios.create({
    baseURL: 'https://www.googleapis.com/youtube/v3',
    params: { key: API_KEY },
})

export default async function handler(req, res) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    const { type } = req.query

    try {
        // 1. Kiểm tra Cache trong Redis
        const cacheKey = `yt_data_${type || 'all'}`
        const cachedData = await redis.get(cacheKey)

        if (cachedData) {
            console.log(`[Proxy] Returning Cached Data for: ${type || 'all'}`)
            return res.status(200).json(cachedData)
        }

        // 2. Nếu không có cache, thực hiện fetch từ YouTube (Chỉ 1 server gọi)
        console.log(`[Proxy] Cache Miss. Fetching from YouTube API for: ${type || 'all'}`)
        let dataToCache = null

        if (type === 'featured') {
            dataToCache = await fetchFeaturedFromYT()
        } else if (type === 'playlists') {
            dataToCache = await fetchPlaylistsFromYT()
        } else if (type === 'playlistItems') {
            const { playlistId, maxResults } = req.query
            dataToCache = await fetchPlaylistItemsFromYT(playlistId, maxResults)
        } else if (type === 'latest') {
            dataToCache = await fetchLatestFromYT()
        } else {
            // Mặc định lấy cả bundle để giảm số lần gọi
            dataToCache = {
                featured: await fetchFeaturedFromYT(),
                latest: await fetchLatestFromYT(),
                playlists: await fetchPlaylistsFromYT()
            }
        }

        // 3. Lưu vào Redis với TTL 10 phút (600s)
        await redis.set(cacheKey, dataToCache, { ex: 600 })

        return res.status(200).json(dataToCache)
    } catch (error) {
        console.error('[Proxy Error]:', error.message)
        res.status(500).json({ error: 'Failed to fetch YouTube data', message: error.message })
    }
}

// --- Helper Functions (Logic bê từ youtubeService.js sang) ---

async function fetchFeaturedFromYT() {
    // 1. Kiểm tra xem có Livestream nào đang hoạt động không
    const latest = await fetchLatestFromYT()
    const activeStream = latest.livestreams.length > 0 ? latest.livestreams[0] : null

    // 2. Lấy danh sách video gần đây để chọn video nhiều view
    const response = await youtubeApi.get('/playlistItems', {
        params: {
            playlistId: UPLOADS_PLAYLIST_ID,
            part: 'snippet,contentDetails',
            maxResults: 50
        }
    })

    const items = response.data.items || []
    if (items.length === 0) return activeStream ? [activeStream] : []

    const videoIds = items.map(item => item.contentDetails.videoId).join(',')

    // 3. Lấy statistics cho các video
    const statsResponse = await youtubeApi.get('/videos', {
        params: {
            id: videoIds,
            part: 'snippet,statistics'
        }
    })

    const topVideos = statsResponse.data.items
        .sort((a, b) => parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount))
        .map(item => ({
            id: { videoId: item.id },
            snippet: item.snippet,
            statistics: item.statistics,
            isLive: item.snippet.liveBroadcastContent === 'live'
        }))

    // 4. Kết hợp: Livestream luôn đứng đầu, sau đó là các video hot nhất (loại bỏ video trùng nếu đang live)
    let finalFeatured = []
    if (activeStream) {
        finalFeatured.push({ ...activeStream, isLive: true })
    }

    // Thêm các video hot, tránh trùng với video đang live
    topVideos.forEach(v => {
        if (finalFeatured.length < 5 && (!activeStream || v.id.videoId !== activeStream.id.videoId)) {
            finalFeatured.push(v)
        }
    })

    return finalFeatured
}

async function fetchPlaylistsFromYT() {
    const response = await youtubeApi.get('/playlists', {
        params: {
            channelId: CHANNEL_ID,
            part: 'snippet,contentDetails',
            maxResults: 10
        }
    })
    return response.data.items || []
}

async function fetchLatestFromYT() {
    const response = await youtubeApi.get('/activities', {
        params: {
            channelId: CHANNEL_ID,
            part: 'snippet,contentDetails',
            maxResults: 20
        }
    })

    const uploads = response.data.items.filter(item => item.snippet.type === 'upload')
    if (uploads.length === 0) return { videos: [], livestreams: [] }

    const videoIds = uploads.map(item => item.contentDetails.upload.videoId).join(',')
    const detailsResponse = await youtubeApi.get('/videos', {
        params: {
            id: videoIds,
            part: 'snippet,liveStreamingDetails'
        }
    })

    const allItems = detailsResponse.data.items
    return {
        // Chỉ lấy những video thực sự đang LIVE
        livestreams: allItems
            .filter(item => item.snippet.liveBroadcastContent === 'live')
            .map(item => ({ id: { videoId: item.id }, snippet: item.snippet, isLive: true })),

        // Videos thường (không bao gồm scheduled/upcoming streams)
        videos: allItems
            .filter(item => item.snippet.liveBroadcastContent !== 'live' && item.snippet.liveBroadcastContent !== 'upcoming')
            .map(item => ({ id: { videoId: item.id }, snippet: item.snippet, isLive: false }))
    }
}
