import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ListVideo, Loader2 } from 'lucide-react';
import { getPlaylists, getPlaylistVideos } from '../services/youtubeService';
import './PlaylistExplorer.css';

const PlaylistExplorer = () => {
    const [activeTab, setActiveTab] = useState(null);
    const [playlists, setPlaylists] = useState([]);
    const [activeVideos, setActiveVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingVideos, setLoadingVideos] = useState(false);

    useEffect(() => {
        const fetchPlaylists = async () => {
            setLoading(true);
            try {
                const data = await getPlaylists();
                if (data && data.length > 0) {
                    const formatted = data.map(p => ({
                        id: p.id,
                        title: p.snippet.title,
                        count: p.contentDetails.itemCount,
                        thumbnail: p.snippet.thumbnails.default.url,
                        link: `https://www.youtube.com/playlist?list=${p.id}`
                    }));
                    setPlaylists(formatted);
                    setActiveTab(formatted[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch playlists:", error);
            }
            setLoading(false);
        };
        fetchPlaylists();
    }, []);

    useEffect(() => {
        if (!activeTab) return;

        const fetchVideos = async () => {
            setLoadingVideos(true);
            try {
                const data = await getPlaylistVideos(activeTab, 3);
                if (data && Array.isArray(data)) {
                    const formatted = data.map(item => ({
                        id: item.snippet.resourceId?.videoId || item.contentDetails?.videoId,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url,
                        timestamp: new Date(item.snippet.publishedAt).toLocaleDateString()
                    }));
                    setActiveVideos(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch playlist videos:", error);
            }
            setLoadingVideos(false);
        };
        fetchVideos();
    }, [activeTab]);

    if (loading) {
        return (
            <div className="playlist-loading">
                <Loader2 className="spinner" />
                <p>Loading playlists...</p>
            </div>
        );
    }

    if (playlists.length === 0) {
        return null;
    }

    const activePlaylist = playlists.find(p => p.id === activeTab);

    return (
        <div className="playlist-explorer">
            <div className="playlist-tabs-container">
                <div className="playlist-tabs">
                    {playlists.map(p => (
                        <button
                            key={p.id}
                            className={`tab-btn ${activeTab === p.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(p.id)}
                        >
                            <ListVideo size={16} />
                            <span>{p.title}</span>
                            <span className="count">{p.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="playlist-view">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        className="playlist-content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {loadingVideos ? (
                            <div className="loading-state">
                                <Loader2 className="spinner" />
                            </div>
                        ) : (
                            <div className="video-row">
                                {activeVideos.map(video => (
                                    <a
                                        key={video.id}
                                        href={`https://www.youtube.com/watch?v=${video.id}&list=${activeTab}`}
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

                                {activeVideos.length > 0 && (
                                    <a
                                        href={activePlaylist.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="see-more-card"
                                    >
                                        <div className="icon-circle">
                                            <ListVideo size={24} />
                                        </div>
                                        <span>Xem toàn bộ</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PlaylistExplorer;
