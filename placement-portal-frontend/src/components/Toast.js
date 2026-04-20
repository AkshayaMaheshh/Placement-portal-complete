import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -20, x: 20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                    style={{
                        position: 'fixed',
                        top: '110px',
                        right: '40px',
                        zIndex: 9999,
                        padding: '16px 24px',
                        background: 'rgba(20, 20, 20, 0.65)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderRadius: '12px',
                        border: `1px solid ${type === 'success' ? 'rgba(46, 204, 113, 0.5)' : 'rgba(231, 76, 60, 0.5)'}`,
                        boxShadow: type === 'success' ? '0 0 25px rgba(46, 204, 113, 0.25)' : '0 0 25px rgba(231, 76, 60, 0.25)',
                        color: 'white',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '15px'
                    }}
                >
                    <span style={{ fontSize: '1.3rem' }}>
                        {type === 'success' ? '✅' : '⚠️'}
                    </span>
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
