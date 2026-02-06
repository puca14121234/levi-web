import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import * as youtubeService from '../youtubeService';

// Mock axios
vi.mock('axios', () => {
    const mockAxios = {
        create: vi.fn(() => mockAxios),
        get: vi.fn(),
    };
    return { default: mockAxios };
});

// Mock browser globals
vi.stubGlobal('location', { hostname: 'localhost' });

describe('youtubeService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getPlaylists', () => {
        it('should fetch playlists and return items', async () => {
            const mockData = { items: [{ id: '1', snippet: { title: 'Test Playlist' } }] };
            axios.get.mockResolvedValueOnce({ data: mockData });

            const result = await youtubeService.getPlaylists();

            expect(result).toEqual(mockData.items);
        });

        it('should return fallback data on error', async () => {
            axios.get.mockRejectedValueOnce(new Error('API Error'));

            const result = await youtubeService.getPlaylists();

            // Should return MOCK_PLAYLISTS from the service file
            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(0);
            expect(result[0].snippet.title).toBe('One for all');
        });
    });

    describe('getCategorizedLatestContent', () => {
        it('should return fallback when API fails', async () => {
            axios.get.mockRejectedValue(new Error('API Error'));
            const result = await youtubeService.getCategorizedLatestContent();
            expect(result).toEqual({ videos: [], livestreams: [], shorts: [] });
        });
    });
});
