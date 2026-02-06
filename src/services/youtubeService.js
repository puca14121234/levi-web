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
    const res = await directApi.get('/activities', { params: { channelId: CHANNEL_ID, part: 'snippet,contentDetails', maxResults: 20 } });
    const uploads = res.data.items.filter(i => i.snippet.type === 'upload');
    const videoIds = uploads.map(i => i.contentDetails.upload.videoId).join(',');
    const details = await directApi.get('/videos', { params: { id: videoIds, part: 'snippet,liveStreamingDetails' } });
    const all = details.data.items;

    return {
        livestreams: all.filter(i => i.snippet.liveBroadcastContent === 'live').map(i => ({ id: { videoId: i.id }, snippet: i.snippet, isLive: true })),
        videos: all.filter(i => i.snippet.liveBroadcastContent !== 'live' && i.snippet.liveBroadcastContent !== 'upcoming').map(i => ({ id: { videoId: i.id }, snippet: i.snippet, isLive: false }))
    };
};

const fetchPlaylistsDirectly = async () => {
    const res = await directApi.get('/playlists', { params: { channelId: CHANNEL_ID, part: 'snippet,contentDetails', maxResults: 10 } });
    return res.data.items;
};

// --- PUBLIC EXPORTS ---
export const getCategorizedLatestContent = async (maxResults = 10) => {
    return await smartFetch('/youtube', { type: 'latest' }, { videos: [], livestreams: [] });
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
