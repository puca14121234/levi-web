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

const VIDEO_DB_KEY = 'yt_video_db_v1';
const LAST_SYNC_KEY = 'yt_last_sync_v1';
const SYNC_LOCK_KEY = 'yt_sync_lock';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { type } = req.query;

    try {
        // 1. Kiểm tra và thực hiện Đồng bộ dữ liệu (Incremental hoặc Deep)
        await ensureDataSynced();

        // 2. Lấy dữ liệu từ Redis DB
        const rawVideos = await redis.hgetall(VIDEO_DB_KEY) || {};
        const allVideos = Object.values(rawVideos).map(v => typeof v === 'string' ? JSON.parse(v) : v);

        // 3. Xử lý theo từng loại yêu cầu
        if (type === 'latest') {
            const result = categorizeVideos(allVideos);
            return res.status(200).json(result);
        }

        if (type === 'featured') {
            const featured = allVideos
                .filter(v => !v.isShort) // Ưu tiên video dài làm featured
                .sort((a, b) => (parseInt(b.statistics?.viewCount || 0)) - (parseInt(a.statistics?.viewCount || 0)))
                .slice(0, 5);
            return res.status(200).json(featured);
        }

        if (type === 'playlists') {
            const data = await fetchPlaylistsFromYT();
            return res.status(200).json(data);
        }

        if (type === 'playlistItems') {
            const { playlistId, maxResults } = req.query;
            const data = await fetchPlaylistItemsFromYT(playlistId, maxResults);
            return res.status(200).json(data);
        }

        // Mặc định: Trả về Bundle (cho App initialization)
        const latest = categorizeVideos(allVideos);
        const featured = allVideos
            .filter(v => !v.isShort)
            .sort((a, b) => (parseInt(b.statistics?.viewCount || 0)) - (parseInt(a.statistics?.viewCount || 0)))
            .slice(0, 5);

        return res.status(200).json({
            featured,
            latest,
            playlists: await fetchPlaylistsFromYT()
        });

    } catch (error) {
        console.error('[YouTube API Error]:', error.message);
        res.status(500).json({ error: 'Sync Failed', message: error.message });
    }
}

// --- CORE SYNC LOGIC ---

async function ensureDataSynced() {
    const lastSync = await redis.get(LAST_SYNC_KEY);
    const now = Date.now();

    // Nếu chưa bao giờ sync hoặc quá 10 phút chưa sync 50 video mới nhất
    if (!lastSync || (now - lastSync) > 600000) {
        // Sử dụng Lock để tránh nhiều request cùng sync một lúc
        const lock = await redis.set(SYNC_LOCK_KEY, 'locked', { nx: true, ex: 60 });
        if (lock) {
            console.log('[Sync] Starting Incremental/First Sync...');
            await performSync(!lastSync); // deepSync = true nếu chưa bao giờ sync
            await redis.set(LAST_SYNC_KEY, now);
            await redis.del(SYNC_LOCK_KEY);
        }
    }
}

async function performSync(isDeep = false) {
    let pageToken = '';
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 60); // 60 ngày

    let syncedCount = 0;
    const maxPages = isDeep ? 5 : 1; // Deep sync quét 5 trang (250 video), Incremental quét 1 trang (50 video)

    for (let p = 0; p < maxPages; p++) {
        const res = await youtubeApi.get('/playlistItems', {
            params: {
                playlistId: UPLOADS_PLAYLIST_ID,
                part: 'snippet,contentDetails',
                maxResults: 50,
                pageToken
            }
        });

        const items = res.data.items || [];
        if (items.length === 0) break;

        const videoIds = items.map(i => i.contentDetails.videoId).join(',');
        const details = await youtubeApi.get('/videos', {
            params: { id: videoIds, part: 'snippet,contentDetails,liveStreamingDetails,statistics' }
        });

        const videos = details.data.items;
        for (const v of videos) {
            const publishedAt = new Date(v.snippet.publishedAt);
            if (!isDeep && publishedAt < dateLimit) continue; // Skip nếu video quá cũ trong bản incremental

            const duration = v.contentDetails.duration;
            const isShort = checkIsShort(duration);

            const videoData = {
                id: { videoId: v.id },
                snippet: v.snippet,
                contentDetails: v.contentDetails,
                liveStreamingDetails: v.liveStreamingDetails,
                statistics: v.statistics,
                isShort,
                isLive: v.snippet.liveBroadcastContent === 'live',
                updatedAt: Date.now()
            };

            await redis.hset(VIDEO_DB_KEY, { [v.id]: videoData });
            syncedCount++;
        }

        pageToken = res.data.nextPageToken;
        if (!pageToken || (!isDeep && syncedCount >= 50)) break;
    }
    console.log(`[Sync] Completed. ${isDeep ? 'Deep' : 'Incremental'} sync processed ${syncedCount} videos.`);
}

// --- HELPERS ---

function checkIsShort(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return false;
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return totalSeconds > 0 && totalSeconds <= 60;
}

function categorizeVideos(allVideos) {
    // Sắp xếp video theo thời gian mới nhất
    const sorted = allVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));

    const livestreamsActive = sorted.filter(v => v.isLive);
    const livestreamsPast = sorted.filter(v => !v.isLive && !!v.liveStreamingDetails);

    const shorts = sorted.filter(v => v.isShort);

    const videos = sorted.filter(v => {
        const isStream = v.isLive || v.snippet.liveBroadcastContent === 'upcoming';
        const hasBeenStreamed = !!v.liveStreamingDetails;
        return !isStream && !hasBeenStreamed && !v.isShort;
    });

    return {
        livestreams: [...livestreamsActive, ...livestreamsPast].slice(0, 3),
        videos: videos.slice(0, 12),
        shorts: shorts.slice(0, 10)
    };
}

async function fetchPlaylistsFromYT() {
    const response = await youtubeApi.get('/playlists', {
        params: { channelId: CHANNEL_ID, part: 'snippet,contentDetails', maxResults: 10 }
    });
    return response.data.items || [];
}

async function fetchPlaylistItemsFromYT(playlistId, maxResults = 10) {
    const response = await youtubeApi.get('/playlistItems', {
        params: { playlistId, part: 'snippet,contentDetails', maxResults }
    });
    return response.data.items || [];
}
