import React, { useEffect, useState } from 'react';
import { Play, Loader2, ArrowRight } from 'lucide-react';
import { getPlaylistVideos } from '../services/youtubeService';
import './LatestVideos.css'; // Reusing styles

const VlogList = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const VLOG_PLAYLIST_ID = 'PLx9OTCF0H3SWGmXUpyfy0Mw8myuwFAQ88';

    useEffect(() => {
        const fetchVlogs = async () => {
            setLoading(true);
            try {
                const data = await getPlaylistVideos(VLOG_PLAYLIST_ID, 3);
                if (data && data.length > 0) {
                    const formatted = data.map(item => ({
                        id: item.snippet.resourceId.videoId,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url,
                        timestamp: new Date(item.snippet.publishedAt).toLocaleDateString()
                    }));
                    setVideos(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch vlogs:", error);
            }
            setLoading(false);
        };
        fetchVlogs();
    }, []);

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="spinner" />
                <p>Fetching vlogs...</p>
            </div>
        );
    }

    if (videos.length === 0) return null;

    return (
        <div className="row-wrapper">
            <div className="video-row">
                {videos.map((video) => (
                    <a
                        key={video.id}
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="video-card-mini"
                    >
                        <div className="video-thumbnail">
                            <img src={video.thumbnail} alt={video.title} />
                            <div className="play-overlay">
                                <Play fill="white" size={24} />
                            </div>
                        </div>
                        <div className="video-info">
                            <h4 className="video-title" dangerouslySetInnerHTML={{ __html: video.title }}></h4>
                            <div className="video-meta">
                                <span>{video.timestamp}</span>
                            </div>
                        </div>
                    </a>
                ))}

                <a
                    href={`https://www.youtube.com/playlist?list=${VLOG_PLAYLIST_ID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="see-more-card"
                >
                    <div className="icon-circle">
                        <ArrowRight size={24} />
                    </div>
                    <span>Xem Playlist</span>
                </a>
            </div>
        </div>
    );
};

export default VlogList;
