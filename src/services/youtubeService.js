import axios from 'axios';

const CHANNEL_ID = 'UClbFnMu72DbIvh6aZebAHsA';
const UPLOADS_PLAYLIST_ID = 'UUlbFnMu72DbIvh6aZebAHsA';
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

// --- MOCK DATA ---
const MOCK_FEATURED = [
    {
        id: { videoId: '5f9V7i_hN1o' },
        snippet: { title: 'LEVI KHÔNG THỂ TIN NỔI TRƯỚC SỨC MẠNH CỦA ONE FOR ALL', thumbnails: { high: { url: 'https://img.youtube.com/vi/5f9V7i_hN1o/maxresdefault.jpg' } }, publishedAt: new Date().toISOString(), liveBroadcastContent: 'none' },
        statistics: { viewCount: '250000' }
    }
];

const MOCK_PLAYLISTS = [
    { id: 'PL_OneForAll', snippet: { title: 'One for all', thumbnails: { default: { url: 'https://img.youtube.com/vi/5f9V7i_hN1o/default.jpg' } } }, contentDetails: { itemCount: 15 } }
];

// --- API INSTANCES ---
const proxyApi = axios.create({ baseURL: '/api' });
const directApi = axios.create({
    baseURL: 'https://www.googleapis.com/youtube/v3',
    params: { key: API_KEY }
});

const isLocal = window.location.hostname === 'localhost';

// --- CORE SMART FETCH LOGIC ---
const smartFetch = async (endpoint, params = {}, fallback) => {
    try {
        if (!isLocal) {
            const res = await proxyApi.get(endpoint, { params });
            return res.data;
        }
        throw new Error('Local Environment');
    } catch (e) {
        try {
            if (endpoint === '/youtube') {
                if (params.type === 'featured') return await fetchFeaturedDirectly();
                if (params.type === 'latest') return await fetchLatestDirectly();
                if (params.type === 'playlists') return await fetchPlaylistsDirectly();
            }
            const res = await directApi.get(endpoint, { params });
            return res.data;
        } catch (err) {
            return fallback;
        }
    }
};

// --- DIRECT FETCH HELPERS (Local) ---
const fetchFeaturedDirectly = async () => {
    const latest = await fetchLatestDirectly();
    const activeStream = latest.livestreams.length > 0 ? latest.livestreams[0] : null;

    const res = await directApi.get('/playlistItems', { params: { playlistId: UPLOADS_PLAYLIST_ID, part: 'snippet,contentDetails', maxResults: 50 } });
    const items = res.data.items || [];
    const videoIds = items.map(i => i.contentDetails.videoId).join(',');
    const stats = await directApi.get('/videos', { params: { id: videoIds, part: 'snippet,statistics' } });

    const topVideos = stats.data.items
        .sort((a, b) => b.statistics.viewCount - a.statistics.viewCount)
        .map(item => ({ id: { videoId: item.id }, snippet: item.snippet, statistics: item.statistics, isLive: item.snippet.liveBroadcastContent === 'live' }));

    let final = [];
    if (activeStream) final.push({ ...activeStream, isLive: true });

    topVideos.forEach(v => {
        if (final.length < 5 && (!activeStream || v.id.videoId !== activeStream.id.videoId)) {
            final.push(v);
        }
    });
    return final;
};

const fetchLatestDirectly = async () => {
    // Tăng maxResults để có đủ dữ liệu phân loại (Shorts, Video, Stream)
    const res = await directApi.get('/activities', { params: { channelId: CHANNEL_ID, part: 'snippet,contentDetails', maxResults: 50 } });
    const uploads = res.data.items.filter(i => i.snippet.type === 'upload');
    const videoIds = uploads.map(i => i.contentDetails.upload.videoId).join(',');

    // Fetch chi tiết video bao gồm cả contentDetails (thời lượng) và liveStreamingDetails
    const details = await directApi.get('/videos', { params: { id: videoIds, part: 'snippet,contentDetails,liveStreamingDetails' } });
    const all = details.data.items;

    // Helper kiểm tra video Shorts (thời lượng < 60 giây)
    const isShort = (duration) => {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return false;
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const seconds = parseInt(match[3]) || 0;
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        return totalSeconds > 0 && totalSeconds < 60;
    };

    const livestreams = all
        .filter(i => i.snippet.liveBroadcastContent === 'live')
        .map(i => ({ id: { videoId: i.id }, snippet: i.snippet, isLive: true }));

    const shorts = all
        .filter(i => isShort(i.contentDetails.duration))
        .map(i => ({ id: { videoId: i.id }, snippet: i.snippet, isShort: true }));

    const videos = all
        .filter(i => {
            const isStream = i.snippet.liveBroadcastContent === 'live' || i.snippet.liveBroadcastContent === 'upcoming';
            const hasBeenStreamed = !!i.liveStreamingDetails; // Livestream đã kết thúc vẫn có details này
            const isShortVideo = isShort(i.contentDetails.duration);
            return !isStream && !hasBeenStreamed && !isShortVideo;
        })
        .map(i => ({ id: { videoId: i.id }, snippet: i.snippet, isLive: false }));

    return {
        livestreams: livestreams.slice(0, 3), // Lấy tối đa 3 stream mới nhất
        videos: videos.slice(0, 20),
        shorts: shorts.slice(0, 10)
    };
};

const fetchPlaylistsDirectly = async () => {
    const res = await directApi.get('/playlists', { params: { channelId: CHANNEL_ID, part: 'snippet,contentDetails', maxResults: 10 } });
    return res.data.items;
};

// --- PUBLIC EXPORTS ---
export const getCategorizedLatestContent = async () => {
    return await smartFetch('/youtube', { type: 'latest' }, { videos: [], livestreams: [], shorts: [] });
};

export const getLatestVideos = async (maxResults = 4) => {
    const { videos } = await getCategorizedLatestContent(maxResults);
    return videos;
};

export const getFeaturedVideos = async () => {
    return await smartFetch('/youtube', { type: 'featured' }, MOCK_FEATURED);
};

export const getPlaylistVideos = async (playlistId, maxResults = 5) => {
    const data = await smartFetch('/youtube', { type: 'playlistItems', playlistId, maxResults }, MOCK_FEATURED);
    return data.items || data;
};

export const getPlaylists = async () => {
    return await smartFetch('/youtube', { type: 'playlists' }, MOCK_PLAYLISTS);
};
