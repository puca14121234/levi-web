import axios from 'axios';

const CHANNEL_ID = 'UClbFnMu72DbIvh6aZebAHsA';
const UPLOADS_PLAYLIST_ID = 'UUlbFnMu72DbIvh6aZebAHsA';

// --- MOCK DATA (Dành cho trường hợp API lỗi/hết Quota để web vẫn đẹp) ---
const MOCK_FEATURED = [
    {
        id: { videoId: '5f9V7i_hN1o' },
        snippet: {
            title: 'LEVI KHÔNG THỂ TIN NỔI TRƯỚC SỨC MẠNH CỦA ONE FOR ALL',
            thumbnails: { high: { url: 'https://img.youtube.com/vi/5f9V7i_hN1o/maxresdefault.jpg' } },
            publishedAt: new Date().toISOString()
        },
        statistics: { viewCount: '250000' }
    },
    {
        id: { videoId: 'pS-W_FqY694' },
        snippet: {
            title: 'HÀNH TRÌNH LEO RANK THÁCH ĐẤU CỦA ĐỘI TRƯỞNG LEVI',
            thumbnails: { high: { url: 'https://img.youtube.com/vi/pS-W_FqY694/maxresdefault.jpg' } },
            publishedAt: new Date().toISOString()
        },
        statistics: { viewCount: '180000' }
    },
    {
        id: { videoId: 'L-N7K8uBw9U' },
        snippet: {
            title: 'LEVI REACTION: KHI CÁC TUYỂN THỦ HÀN QUỐC NÓI VỀ GAM',
            thumbnails: { high: { url: 'https://img.youtube.com/vi/L-N7K8uBw9U/maxresdefault.jpg' } },
            publishedAt: new Date().toISOString()
        },
        statistics: { viewCount: '150000' }
    },
    {
        id: { videoId: 'mN9M6-xXk0U' },
        snippet: {
            title: 'VLOG: MỘT NGÀY TẠI GAM GAMING HOUSE CÙNG LEVI',
            thumbnails: { high: { url: 'https://img.youtube.com/vi/mN9M6-xXk0U/maxresdefault.jpg' } },
            publishedAt: new Date().toISOString()
        },
        statistics: { viewCount: '120000' }
    },
    {
        id: { videoId: 'Kz9T7-yW7w0' },
        snippet: {
            title: 'TOP 5 PHA CƯỚP BARON KINH ĐIỂN CỦA "THẦN RỪNG" LEVI',
            thumbnails: { high: { url: 'https://img.youtube.com/vi/Kz9T7-yW7w0/maxresdefault.jpg' } },
            publishedAt: new Date().toISOString()
        },
        statistics: { viewCount: '300000' }
    }
];

const MOCK_PLAYLISTS = [
    { id: 'PL_OneForAll', snippet: { title: 'One for all', thumbnails: { default: { url: 'https://img.youtube.com/vi/5f9V7i_hN1o/default.jpg' } } }, contentDetails: { itemCount: 15 } },
    { id: 'PL_LeviReaction', snippet: { title: 'Levi Reaction', thumbnails: { default: { url: 'https://img.youtube.com/vi/L-N7K8uBw9U/default.jpg' } } }, contentDetails: { itemCount: 42 } },
    { id: 'PL_LeviVlog', snippet: { title: 'LEVI VLOG', thumbnails: { default: { url: 'https://img.youtube.com/vi/mN9M6-xXk0U/default.jpg' } } }, contentDetails: { itemCount: 12 } }
];

const youtubeApi = axios.create({
    baseURL: '/api', // Gọi tới Vercel Proxy thay vì Google
});

// Helper xử lý lỗi Quota
const handleYoutubeError = (error, fallbackData, functionName) => {
    if (error.response && error.response.status === 403) {
        console.error(`[YouTube API] 403 Forbidden in ${functionName}. Possible Quota Exceeded. Using Mock Data.`);
    } else {
        console.error(`[YouTube API] Error in ${functionName}:`, error.message);
    }
    return fallbackData;
};

export const getCategorizedLatestContent = async (maxResults = 10) => {
    try {
        const response = await youtubeApi.get('/youtube', { params: { type: 'latest' } });
        return response.data || { videos: MOCK_FEATURED.slice(0, maxResults), livestreams: [] };
    } catch (error) {
        return handleYoutubeError(error, { videos: MOCK_FEATURED.slice(0, maxResults), livestreams: [] }, 'getCategorizedLatestContent');
    }
};

export const getLatestVideos = async (maxResults = 4) => {
    const { videos } = await getCategorizedLatestContent(maxResults);
    return videos;
};

export const getFeaturedVideos = async (maxResults = 5) => {
    try {
        const response = await youtubeApi.get('/youtube', { params: { type: 'featured' } });
        return response.data || MOCK_FEATURED.slice(0, maxResults);
    } catch (error) {
        return handleYoutubeError(error, MOCK_FEATURED.slice(0, maxResults), 'getFeaturedVideos');
    }
};

export const getPlaylistVideos = async (playlistId, maxResults = 5) => {
    try {
        const response = await youtubeApi.get('/playlistItems', { params: { playlistId, part: 'snippet', maxResults } });
        return response.data.items;
    } catch (error) {
        return handleYoutubeError(error, MOCK_FEATURED.slice(0, maxResults), 'getPlaylistVideos');
    }
};

export const getPlaylists = async () => {
    try {
        const response = await youtubeApi.get('/youtube', { params: { type: 'playlists' } });
        return response.data || MOCK_PLAYLISTS;
    } catch (error) {
        return handleYoutubeError(error, MOCK_PLAYLISTS, 'getPlaylists');
    }
};
