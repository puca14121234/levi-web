import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="container">
                <div className="footer-content">
                    <p className="copyright">&copy; {new Date().getFullYear()} LEVI. All rights reserved.</p>
                    <div className="footer-links">
                        <a href="https://www.youtube.com/@Levi97" target="_blank" rel="noopener noreferrer">YouTube</a>
                        <a href="https://www.facebook.com/lolLevi/" target="_blank" rel="noopener noreferrer">Facebook</a>
                        <a href="https://www.tiktok.com/@lollevi97" target="_blank" rel="noopener noreferrer">TikTok</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
