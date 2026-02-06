import axios from 'axios';

const CHANNEL_ID = 'UClbFnMu72DbIvh6aZebAHsA';
const UPLOADS_PLAYLIST_ID = 'UUlbFnMu72DbIvh6aZebAHsA';
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

// --- MOCK DATA (Dữ liệu dự phòng siêu cấp) ---
const MOCK_FEATURED = [
    {
        id: { videoId: '5f9V7i_hN1o' },
        snippet: { title: 'LEVI KHÔNG THỂ TIN NỔI TRƯỚC SỨC MẠNH CỦA ONE FOR ALL', thumbnails: { high: { url: 'https://img.youtube.com/vi/5f9V7i_hN1o/maxresdefault.jpg' } }, publishedAt: new Date().toISOString() },
        statistics: { viewCount: '250000' }
    },
    {
        id: { videoId: 'pS-W_FqY694' },
        snippet: { title: 'HÀNH TRÌNH LEO RANK THÁCH ĐẤU CỦA ĐỘI TRƯỞNG LEVI', thumbnails: { high: { url: 'https://img.youtube.com/vi/pS-W_FqY694/maxresdefault.jpg' } }, publishedAt: new Date().toISOString() },
        statistics: { viewCount: '180000' }
    },
    {
        id: { videoId: 'L-N7K8uBw9U' },
        snippet: { title: 'LEVI REACTION: KHI CÁC TUYỂN THỦ HÀN QUỐC NÓI VỀ GAM', thumbnails: { high: { url: 'https://img.youtube.com/vi/L-N7K8uBw9U/maxresdefault.jpg' } }, publishedAt: new Date().toISOString() },
        statistics: { viewCount: '150000' }
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
        // 1. Thử gọi qua Proxy (Vercel)
        if (!isLocal) {
            const res = await proxyApi.get(endpoint, { params });
            return res.data;
        }

        // 2. Nếu là Local, ưu tiên gọi trực tiếp để dev cho nhanh (vì /api không chạy trên Vite dev)
        throw new Error('Local Environment: Switching to Direct API');
    } catch (proxyError) {
        try {
            // 3. Gọi trực tiếp YouTube API (Dùng API_KEY trong .env)
            if (endpoint === '/youtube') {
                // Mapping proxy endpoints back to original YouTube endpoints for local dev
                if (params.type === 'featured') return await fetchFeaturedDirectly();
                if (params.type === 'playlists') return await fetchPlaylistsDirectly();
                if (params.type === 'latest') return await fetchLatestDirectly();
            }
            const res = await directApi.get(endpoint, { params });
            return res.data;
        } catch (directError) {
            console.warn(`[YouTube Service] Both Proxy and Direct API failed. Using Mock Data.`, directError.message);
            return fallback;
        }
    }
};

// --- DIRECT FETCH HELPERS (Dành cho Local Dev) ---
const fetchFeaturedDirectly = async () => {
    const res = await directApi.get('/playlistItems', { params: { playlistId: UPLOADS_PLAYLIST_ID, part: 'snippet,contentDetails', maxResults: 50 } });
    const videoIds = res.data.items.map(i => i.contentDetails.videoId).join(',');
    const stats = await directApi.get('/videos', { params: { id: videoIds, part: 'snippet,statistics' } });
    return stats.data.items.sort((a, b) => b.statistics.viewCount - a.statistics.viewCount).slice(0, 5).map(item => ({ id: { videoId: item.id }, snippet: item.snippet, statistics: item.statistics }));
};

const fetchPlaylistsDirectly = async () => {
    const res = await directApi.get('/playlists', { params: { channelId: CHANNEL_ID, part: 'snippet,contentDetails', maxResults: 10 } });
    return res.data.items;
};

const fetchLatestDirectly = async () => {
    const res = await directApi.get('/activities', { params: { channelId: CHANNEL_ID, part: 'snippet,contentDetails', maxResults: 20 } });
    const uploads = res.data.items.filter(i => i.snippet.type === 'upload');
    const videoIds = uploads.map(i => i.contentDetails.upload.videoId).join(',');
    const details = await directApi.get('/videos', { params: { id: videoIds, part: 'snippet,liveStreamingDetails' } });
    const all = details.data.items;
    return {
        livestreams: all.filter(i => i.liveStreamingDetails).map(i => ({ id: { videoId: i.id }, snippet: i.snippet })),
        videos: all.filter(i => !i.liveStreamingDetails).map(i => ({ id: { videoId: i.id }, snippet: i.snippet }))
    };
};

// --- PUBLIC EXPORTS ---
export const getCategorizedLatestContent = async (maxResults = 10) => {
    return await smartFetch('/youtube', { type: 'latest' }, { videos: MOCK_FEATURED, livestreams: [] });
};

export const getLatestVideos = async (maxResults = 4) => {
    const { videos } = await getCategorizedLatestContent(maxResults);
    return videos;
};

export const getFeaturedVideos = async (_maxResults = 5) => {
    return await smartFetch('/youtube', { type: 'featured' }, MOCK_FEATURED);
};

export const getPlaylistVideos = async (playlistId, maxResults = 5) => {
    const data = await smartFetch('/playlistItems', { playlistId, part: 'snippet', maxResults }, { items: MOCK_FEATURED });
    return data.items || data;
};

export const getPlaylists = async () => {
    return await smartFetch('/youtube', { type: 'playlists' }, MOCK_PLAYLISTS);
};
