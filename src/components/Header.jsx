import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Facebook, Video, Radio, Menu, X, ExternalLink } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [isLive, setIsLive] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock checking live status - In real app, this would be an API call
  useEffect(() => {
    const checkLive = () => {
      // Levi is usually live on specific times, for now we randomize for demo
      setIsLive(Math.random() > 0.4);
    };
    checkLive();
    const interval = setInterval(checkLive, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Nổi bật', href: '#featured' },
    { name: 'Mạng xã hội', href: '#social' },
    { name: 'Video mới', href: '#latest' },
    { name: 'Vlog', href: '#vlog' },
    { name: 'Playlist', href: '#playlists' },
  ];

  return (
    <header className={`header-container ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-content container">
        <div className="header-left">
          <a href="/" className="logo">LEVI</a>
        </div>

        {/* Main Navigation & Dynamic Island Area */}
        <nav className="header-nav">
          <div className="nav-group left desktop-only">
            {navItems.slice(0, 2).map(item => (
              <a key={item.name} href={item.href} className="nav-link">{item.name}</a>
            ))}
          </div>

          <div className="header-center">
            <motion.div
              className={`dynamic-island ${isLive ? 'live' : 'offline'}`}
              initial={false}
              animate={{
                width: isLive ? '140px' : '90px',
                height: isScrolled ? '32px' : '38px',
                backgroundColor: isLive ? '#000000' : 'rgba(0,0,0,0.8)',
                boxShadow: isLive
                  ? '0 0 20px rgba(255, 204, 0, 0.4), 0 4px 12px rgba(0,0,0,0.2)'
                  : '0 4px 12px rgba(0,0,0,0.1)'
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 1
              }}
            >
              <AnimatePresence mode="wait">
                {isLive ? (
                  <motion.div
                    key="live"
                    className="island-content live"
                    initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="live-dot-wrapper">
                      <div className="live-dot"></div>
                      <div className="live-ring"></div>
                    </div>
                    <span className="live-text">LIVE NOW</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="offline"
                    className="island-content offline"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 0.6, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    <span>OFFLINE</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="nav-group right desktop-only">
            {navItems.slice(2).map(item => (
              <a key={item.name} href={item.href} className="nav-link">{item.name}</a>
            ))}
          </div>
        </nav>

        <div className="header-right mobile-only">
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Premium Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="mobile-menu-content glass"
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <nav className="mobile-nav">
                {navItems.map((item, i) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {item.name}
                  </motion.a>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
