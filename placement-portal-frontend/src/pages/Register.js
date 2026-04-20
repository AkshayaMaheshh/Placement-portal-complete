import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { registerUser } from '../services/api';
import AuthLayout from '../components/AuthLayout';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('STUDENT');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await registerUser({ name, email, password, role });
            alert(response);
            navigate('/');
        } catch (error) {
            alert(`Registration failed: ${error.message}`);
        }
    };

    return (
        <AuthLayout>
            <motion.div
                className="universal-glass-card p-4 p-md-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ width: '100%', maxWidth: '420px' }}
            >
                <div className="text-center mb-4">
                    <h2 className="fw-bold fs-3" style={{ letterSpacing: '-0.5px' }}>Create Account</h2>
                    <p className="mt-1" style={{ fontSize: '15px', color: 'rgba(0, 0, 0, 0.6)' }}>Join us to get started</p>
                </div>

                <form onSubmit={handleRegister} className="d-flex flex-column gap-3">
                    <div>
                        <label className="form-label fw-medium mb-1" style={{ fontSize: '14px' }}>Name</label>
                        <input
                            type="text"
                            className="transparent-input form-control shadow-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div>
                        <label className="form-label fw-medium mb-1" style={{ fontSize: '14px' }}>Email</label>
                        <input
                            type="email"
                            className="transparent-input form-control shadow-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="form-label fw-medium mb-1" style={{ fontSize: '14px' }}>Password</label>
                        <input
                            type="password"
                            className="transparent-input form-control shadow-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div>
                        <label className="form-label fw-medium mb-1" style={{ fontSize: '14px' }}>Role</label>
                        <select
                            className="transparent-input form-select shadow-none"
                            style={{ backgroundColor: 'transparent' }}
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="STUDENT" style={{ color: 'black' }}>Student</option>
                            <option value="COMPANY" style={{ color: 'black' }}>Company</option>
                            <option value="ADMIN" style={{ color: 'black' }}>Faculty / Admin</option>
                        </select>
                    </div>

                    <button type="submit" className="deep-glass-btn mt-3 w-100">
                        Register
                    </button>

                    <div className="text-center mt-3">
                        <Link to="/login" style={{ color: '#000', textDecoration: 'underline', fontSize: '14px' }}>
                            Already have an account? Login
                        </Link>
                    </div>
                </form>
            </motion.div>
        </AuthLayout>
    );
};

export default Register;
