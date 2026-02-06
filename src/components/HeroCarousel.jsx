import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Loader2 } from 'lucide-react';
import { getFeaturedVideos } from '../services/youtubeService';
import './HeroCarousel.css';

const HeroCarousel = () => {
    const [index, setIndex] = useState(0);
    const [featuredItems, setFeaturedItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            setLoading(true);
            try {
                const data = await getFeaturedVideos(5);
                if (data && data.length > 0) {
                    setFeaturedItems(data.map(item => ({
                        id: item.id.videoId,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.maxres ? item.snippet.thumbnails.maxres.url : item.snippet.thumbnails.high.url,
                        category: item.isLive ? "LIVE" : "",
                        isLive: item.isLive
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch featured videos:", error);
            }
            setLoading(false);
        };
        fetchFeatured();
    }, []);

    const next = () => setIndex((prev) => (prev + 1) % featuredItems.length);
    const prev = () => setIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);

    if (loading) {
        return (
            <div className="carousel-loading">
                <Loader2 className="spinner" />
            </div>
        );
    }

    if (featuredItems.length === 0) {
        return null; // Don't show anything if still empty for some reason
    }

    const current = featuredItems[index];

    return (
        <div className="carousel-container">
            <div className="carousel-viewport">
                <AnimatePresence mode="wait" initial={false} custom={index}>
                    <motion.div
                        key={index}
                        className="carousel-slide"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="slide-image-wrapper">
                            <img src={current.thumbnail} alt={current.title} className="slide-image" />
                            <div className="overlay"></div>
                        </div>

                        <div className="slide-content">
                            <span className={`category-tag ${current.isLive ? 'live' : ''}`}>{current.category}</span>
                            <h1 className="slide-title" dangerouslySetInnerHTML={{ __html: current.title }}></h1>
                            <a
                                href={`https://www.youtube.com/watch?v=${current.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pill-button"
                            >
                                <Play size={16} fill="currentColor" />
                                Xem Ngay
                            </a>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="carousel-controls">
                <button onClick={prev} className="control-btn" aria-label="Previous"><ChevronLeft size={24} /></button>
                <button onClick={next} className="control-btn" aria-label="Next"><ChevronRight size={24} /></button>
            </div>

            <div className="carousel-indicators">
                {featuredItems.map((_, i) => (
                    <div
                        key={i}
                        className={`indicator ${i === index ? 'active' : ''}`}
                        onClick={() => setIndex(i)}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroCarousel;
