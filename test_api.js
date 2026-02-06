import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VITE_YOUTUBE_API_KEY;
const HANDLE = '@Levi97';

async function findChannelId() {
    console.log('Testing API Key:', API_KEY);
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: HANDLE,
                type: 'channel',
                key: API_KEY
            }
        });

        if (response.data.items && response.data.items.length > 0) {
            const channel = response.data.items[0];
            console.log('Found Channel:');
            console.log('Title:', channel.snippet.title);
            console.log('Channel ID:', channel.id.channelId);
            console.log('Description:', channel.snippet.description);
        } else {
            console.log('No channel found for handle:', HANDLE);
        }
    } catch (error) {
        if (error.response) {
            console.error('API Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

findChannelId();
