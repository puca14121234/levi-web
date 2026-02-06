import axios from 'axios';

const ACCESS_TOKEN = import.meta.env.VITE_FB_ACCESS_TOKEN;
const PAGE_ID = 'levi97.vcs'; // Placeholder for Levi's Page ID

const fbApi = axios.create({
    baseURL: 'https://graph.facebook.com/v18.0',
    params: {
        access_token: ACCESS_TOKEN,
    },
});

export const getPagePosts = async (limit = 3) => {
    try {
        const response = await fbApi.get(`/${PAGE_ID}/feed`, {
            params: {
                fields: 'message,created_time,full_picture,permalink_url',
                limit,
            },
        });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching Facebook posts:', error);
        return [];
    }
};

export const getPageStats = async () => {
    try {
        const response = await fbApi.get(`/${PAGE_ID}`, {
            params: {
                fields: 'fan_count,followers_count',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching Facebook stats:', error);
        return null;
    }
};
