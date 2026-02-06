import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import * as youtubeService from '../services/youtubeService';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, initial, whileInView, viewport, transition, ...props }) => (
            <div {...props}>{children}</div>
        ),
    },
}));

// Mock child components to isolate App
vi.mock('../components/Header', () => ({ default: () => <header data-testid="mock-header">Header</header> }));
vi.mock('../components/HeroCarousel', () => ({ default: () => <div data-testid="mock-carousel">Carousel</div> }));
vi.mock('../components/SocialStats', () => ({ default: () => <div data-testid="mock-stats">Stats</div> }));
vi.mock('../components/VideoRow', () => ({ default: ({ title }) => <div data-testid="mock-video-row">{title}</div> }));
vi.mock('../components/VlogList', () => ({ default: () => <div data-testid="mock-vlogs">Vlogs</div> }));
vi.mock('../components/PlaylistExplorer', () => ({ default: () => <div data-testid="mock-playlists">Playlists</div> }));
vi.mock('../components/Footer', () => ({ default: () => <footer data-testid="mock-footer">Footer</footer> }));

// Mock YouTube Service
vi.mock('../services/youtubeService', () => ({
    getCategorizedLatestContent: vi.fn(),
}));

describe('App Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        youtubeService.getCategorizedLatestContent.mockResolvedValue({
            videos: [],
            livestreams: [],
            shorts: [],
        });
    });

    it('renders all main sections', async () => {
        render(<App />);

        expect(screen.getByTestId('mock-header')).toBeInTheDocument();
        expect(screen.getByTestId('mock-carousel')).toBeInTheDocument();
        expect(screen.getByTestId('mock-stats')).toBeInTheDocument();
        expect(screen.getByTestId('mock-vlogs')).toBeInTheDocument();
        expect(screen.getByTestId('mock-playlists')).toBeInTheDocument();
        expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    });

    it('fetches data on mount', async () => {
        render(<App />);

        await waitFor(() => {
            expect(youtubeService.getCategorizedLatestContent).toHaveBeenCalled();
        });
    });
});
