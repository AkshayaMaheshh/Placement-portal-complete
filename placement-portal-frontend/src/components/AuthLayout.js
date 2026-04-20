import React from 'react';
import AnimatedBackground from './AnimatedBackground';
import instituteLogo from '../assets/institute-logo.png';
import brandLogo from '../assets/brand-logo.png';
import './AuthLayout.css';

const AuthLayout = ({ children, centered = true }) => {
    return (
        <div className="auth-wrapper">
            <AnimatedBackground />

            {/* Background Scrolling Branding (Shared across Login & Register) */}
            <div className="marquee-wrapper">
                <div className="marquee-track">
                {/* Duplicate content to make an infinite seamless loop */}
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="marquee-item">
                    <span className="marquee-text-large">SIPP</span>
                    <span className="marquee-text-small">Student internship and placement portal</span>
                    </div>
                ))}
                </div>
            </div>

            <div className="logo-left">
                <img src={instituteLogo} alt="Institute Logo" />
            </div>

            <div className="logo-right">
                <img src={brandLogo} alt="Brand Logo" />
            </div>

            <div className={`content-layer ${centered ? 'content-layer-centered' : 'content-layer-dashboard'}`}>
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
