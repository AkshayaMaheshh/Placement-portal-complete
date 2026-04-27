import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginUser, loginWithGoogle } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const data = await loginUser({ email, password });
      handleAuthSuccess(data);
    } catch (error) {
      setErrorMsg(error.message || 'Login failed: Invalid data or server issue.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMsg('');
    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      handleAuthSuccess(data);
    } catch (error) {
      setErrorMsg(error.message || 'Google Login failed.');
    }
  };

  const handleAuthSuccess = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.id);
    localStorage.setItem('studentId', data.id);
    localStorage.setItem('role', data.role);
    navigate('/dashboard');
  };

  return (
    <AuthLayout>
      <motion.div
        className="universal-glass-card p-4 p-md-5"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}
      >
        <div className="text-center mb-5">
          <h2 className="fw-bold fs-3" style={{ letterSpacing: '-0.5px' }}>Welcome Back</h2>
          <p className="mt-1" style={{ fontSize: '15px', color: 'rgba(0, 0, 0, 0.6)' }}>Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="d-flex flex-column gap-4">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2 text-center"
              style={{
                backgroundColor: '#fff',
                color: '#000',
                border: '1px solid #000',
                borderRadius: '8px',
                fontSize: '13px',
                marginTop: '-15px',
                marginBottom: '-5px'
              }}
            >
              {errorMsg}
            </motion.div>
          )}

          <div>
            <input
              type="email"
              className="transparent-input form-control shadow-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
            />
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              className="transparent-input form-control shadow-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{ paddingRight: '50px' }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                padding: '5px 10px',
                outline: 'none'
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" className="deep-glass-btn mt-3 w-100">
            Sign In
          </button>

          <div className="d-flex align-items-center gap-2 my-2">
            <hr className="flex-grow-1" style={{ opacity: 0.1 }} />
            <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.4)', fontWeight: 'bold' }}>OR</span>
            <hr className="flex-grow-1" style={{ opacity: 0.1 }} />
          </div>

          <div className="d-flex justify-content-center">
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrorMsg('Google Sign-In was cancelled or failed')}
                useOneTap
                theme="outline"
                shape="pill"
                size="large"
                text="continue_with"
                width="320"
            />
          </div>

          <div className="text-center mt-1">
            <Link to="/register" style={{ color: '#000', textDecoration: 'underline', fontSize: '14px' }}>
              Don't have an account? Register
            </Link>
          </div>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default Login;
