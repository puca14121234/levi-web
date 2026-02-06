import React from 'react';
import { Youtube, Facebook, Music2, ExternalLink } from 'lucide-react';
import './SocialStats.css';

const SocialStats = () => {
    const stats = [
        {
            id: 'youtube',
            platform: 'YouTube',
            handle: '@Levi97',
            count: '500k+',
            label: 'Subscribers',
            color: '#FF0000',
            icon: <Youtube size={24} />,
            link: 'https://www.youtube.com/@Levi97'
        },
        {
            id: 'facebook',
            platform: 'Facebook',
            handle: 'lolLevi',
            count: '400k+',
            label: 'Followers',
            color: '#1877F2',
            icon: <Facebook size={24} />,
            link: 'https://www.facebook.com/lolLevi/'
        },
        {
            id: 'tiktok',
            platform: 'TikTok',
            handle: '@lollevi97',
            count: '200k+',
            label: 'Followers',
            color: '#000000',
            icon: <Music2 size={24} />,
            link: 'https://www.tiktok.com/@lollevi97'
        }
    ];

    return (
        <div className="social-grid">
            {stats.map((stat) => (
                <a
                    key={stat.id}
                    href={stat.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-card glass"
                >
                    <div className="card-top">
                        <div className="platform-icon" style={{ color: stat.color }}>
                            {stat.icon}
                        </div>
                        <ExternalLink size={14} className="link-icon" />
                    </div>

                    <div className="card-body">
                        <h3 className="stat-count">{stat.count}</h3>
                        <p className="stat-label">{stat.label}</p>
                    </div>

                    <div className="card-bottom">
                        <span className="handle">{stat.handle}</span>
                    </div>
                </a>
            ))}
        </div>
    );
};

export default SocialStats;
