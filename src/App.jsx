import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Header from './components/Header';
import HeroCarousel from './components/HeroCarousel';
import SocialStats from './components/SocialStats';
import VideoRow from './components/VideoRow';
import VlogList from './components/VlogList';
import PlaylistExplorer from './components/PlaylistExplorer';
import Footer from './components/Footer';
import { getCategorizedLatestContent } from './services/youtubeService';
import './App.css';

const Reveal = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

function App() {
  const [categorizedContent, setCategorizedContent] = useState({ videos: [], livestreams: [], shorts: [] });

  useEffect(() => {
    const fetchData = async () => {
      const data = await getCategorizedLatestContent(); // Không cần slice(3) ở đây vì service đã giới hạn
      setCategorizedContent(data);
    };
    fetchData();
  }, []);

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <section id="featured" className="hero-section container">
          <Reveal>
            <HeroCarousel />
          </Reveal>
        </section>

        <section id="social" className="section-padding container">
          <Reveal>
            <SocialStats />
          </Reveal>
        </section>

        {/* Video Shorts */}
        <Reveal>
          <VideoRow
            title="Video Shorts"
            fetchFn={async () => categorizedContent.shorts.slice(0, 5)}
            seeMoreUrl="https://www.youtube.com/@Levi97/shorts"
            isShorts={true}
          />
        </Reveal>

        {/* Livestream mới nhất */}
        <Reveal>
          <VideoRow
            title="Livestream mới nhất"
            fetchFn={async () => categorizedContent.livestreams.slice(0, 3)}
            seeMoreUrl="https://www.youtube.com/@Levi97/streams"
          />
        </Reveal>

        {/* Video mới nhất */}
        <Reveal>
          <VideoRow
            title="Video mới nhất"
            fetchFn={async () => categorizedContent.videos.slice(0, 3)}
            seeMoreUrl="https://www.youtube.com/@Levi97/videos"
          />
        </Reveal>

        <section id="vlog" className="section-padding container" style={{ paddingTop: 0 }}>
          <Reveal>
            <h2 className="section-title">Levi Vlog</h2>
            <VlogList />
          </Reveal>
        </section>

        <section id="playlists" className="section-padding container">
          <Reveal>
            <h2 className="section-title">Playlist nổi bật</h2>
            <PlaylistExplorer />
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
