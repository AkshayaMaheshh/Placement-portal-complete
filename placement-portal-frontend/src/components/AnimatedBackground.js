import React, { useMemo } from 'react';
import './AnimatedBackground.css';

const AnimatedBackground = () => {
    const particles = useMemo(() => {
        return Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}vw`,
            top: `${Math.random() * 100}vh`,
            size: `${Math.random() * 4 + 4}px`, // 4px to 8px
            duration: `${Math.random() * 12 + 8}s`, // 8s to 20s
            delay: `${Math.random() * 5}s`
        }));
    }, []);

    return (
        <div className="animated-background">
            <div className="glow-effect"></div>
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="particle"
                    style={{
                        left: p.left,
                        top: p.top,
                        width: p.size,
                        height: p.size,
                        animationDuration: p.duration,
                        animationDelay: p.delay
                    }}
                ></div>
            ))}
        </div>
    );
};

export default AnimatedBackground;
