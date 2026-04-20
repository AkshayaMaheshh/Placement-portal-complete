import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
            <nav className="universal-glass-card" style={{
                display: 'flex',
                gap: '24px',
                padding: '12px 32px',
                borderRadius: '50px',
                alignItems: 'center',
            }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#000', fontWeight: '500', transition: 'all 0.3s' }} className="hover-scale">Login</Link>
                <Link to="/register" style={{ textDecoration: 'none', color: '#000', fontWeight: '500', transition: 'all 0.3s' }} className="hover-scale">Register</Link>
            </nav>
        </div>
    );
};

export default Navbar;
