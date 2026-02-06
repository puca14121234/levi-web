import React, { useEffect, useState } from 'react';
import { Play, Loader2, ArrowRight } from 'lucide-react';
import { getLatestVideos } from '../services/youtubeService';
import './LatestVideos.css';

const LatestVideos = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            try {
                const data = await getLatestVideos(3); // Show 3 for one row
                if (data && data.length > 0) {
                    const formattedVideos = data.map(item => ({
                        id: item.id.videoId,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url,
                        views: "Recently updated",
                        timestamp: new Date(item.snippet.publishedAt).toLocaleDateString()
                    }));
                    setVideos(formattedVideos);
                } else {
                    setVideos([]);
                }
            } catch (error) {
                console.error("Failed to fetch videos:", error);
                setVideos([]);
            }
            setLoading(false);
        };
        fetchVideos();
    }, []);

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="spinner" />
                <p>Fetching latest videos...</p>
            </div>
        );
    }

    return (
        <div className="row-wrapper">
            <div className="video-row">
                {videos.length > 0 ? videos.map((video) => (
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
                )) : (
                    <div className="error-message">
                        <p>Dữ liệu trống hoặc lỗi API.</p>
                    </div>
                )}

                {videos.length > 0 && (
                    <a
                        href="https://www.youtube.com/@Levi97/videos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="see-more-card"
                    >
                        <div className="icon-circle">
                            <ArrowRight size={24} />
                        </div>
                        <span>Xem thêm</span>
                    </a>
                )}
            </div>
        </div>
    );
};

export default LatestVideos;
