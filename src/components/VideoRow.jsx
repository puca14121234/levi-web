import React, { useEffect, useState } from 'react';
import { Play, Loader2, ArrowRight } from 'lucide-react';
import './LatestVideos.css';

const VideoRow = ({ title, fetchFn, seeMoreUrl }) => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchFn();
                if (data && data.length > 0) {
                    const formattedVideos = data.map(item => ({
                        id: item.id.videoId,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url,
                        timestamp: new Date(item.snippet.publishedAt).toLocaleDateString()
                    }));
                    setVideos(formattedVideos);
                } else {
                    setVideos([]);
                }
            } catch (error) {
                console.error(`Failed to fetch ${title}:`, error);
                setVideos([]);
            }
            setLoading(false);
        };
        loadData();
    }, [fetchFn, title]);

    if (loading) {
        return (
            <div className="section-padding container" style={{ paddingBottom: 0 }}>
                <h2 className="section-title">{title}</h2>
                <div className="loading-state">
                    <Loader2 className="spinner" />
                    <p>Đang tải {title.toLowerCase()}...</p>
                </div>
            </div>
        );
    }

    if (videos.length === 0) return null;

    return (
        <section className="section-padding container" style={{ paddingBottom: 0 }}>
            <h2 className="section-title">{title}</h2>
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
                        href={seeMoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="see-more-card"
                    >
                        <div className="icon-circle">
                            <ArrowRight size={24} />
                        </div>
                        <span>Xem thêm</span>
                    </a>
                </div>
            </div>
        </section>
    );
};

export default VideoRow;
