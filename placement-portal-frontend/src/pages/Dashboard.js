import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import CompanyDashboard from './CompanyDashboard';
import AdminDashboard from './AdminDashboard';
import AuthLayout from '../components/AuthLayout';
import './Login.css';

const Dashboard = () => {
    const [role, setRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedRole = localStorage.getItem('role');
        if (!storedRole) {
            navigate('/login');
        } else {
            setRole(storedRole);
        }
    }, [navigate]);

    if (!role) return null;

    return (
        <AuthLayout centered={false}>
            {role === 'STUDENT' ? (
                <StudentDashboard />
            ) : role === 'COMPANY' ? (
                <CompanyDashboard />
            ) : role === 'ADMIN' ? (
                <AdminDashboard />
            ) : (
                <div className="text-center" style={{ paddingTop: '120px' }}>
                    <h2 className="fw-bold fs-3" style={{ letterSpacing: '-0.5px', color: 'white' }}>Unknown Role</h2>
                    <p className="mt-1" style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.8)' }}>
                        Please contact support.
                    </p>
                </div>
            )}
        </AuthLayout>
    );
};

export default Dashboard;
