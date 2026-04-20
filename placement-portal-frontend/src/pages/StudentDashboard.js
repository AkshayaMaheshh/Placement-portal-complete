import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '../components/Toast';
import { apiFetch } from '../services/api';
import { learningResources } from '../data/learningResources';

const CountUpAnimation = ({ endValue, duration = 1 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        let animationFrame;

        const animateCount = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / (duration * 1000);

            if (progress < 1) {
                setCount(Math.floor(endValue * progress));
                animationFrame = requestAnimationFrame(animateCount);
            } else {
                setCount(endValue);
            }
        };

        animationFrame = requestAnimationFrame(animateCount);
        return () => cancelAnimationFrame(animationFrame);
    }, [endValue, duration]);

    return <>{count}</>;
};

// Animated Progress Bar Component
const ProgressBar = ({ targetPercentage }) => {
    return (
        <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '10px', overflow: 'hidden', marginTop: '10px', marginBottom: '20px' }}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${targetPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', background: '#000', borderRadius: '10px' }}
            />
        </div>
    );
};

const StudentDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };
    // Stagger animation container variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    // Item animation variants (fade in + slide up)
    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    const flexCardVariants = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    const [activeTab, setActiveTab] = useState('Overview');
    
    // Overview data
    const [metrics, setMetrics] = useState({
        totalApplications: 0,
        applied: 0,
        interviews: 0,
        shortlisted: 0,
        rejected: 0
    });
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState([]);
    
    // Resume parser data
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeLoading, setResumeLoading] = useState(false);
    const [resumeData, setResumeData] = useState(null);

    const [toast, setToast] = useState({ message: '', type: '' });
    
    // Zoom intro state
    const [showIntro, setShowIntro] = useState(false);

    // Skill Gap & Details Modal states
    const [selectedItemForGap, setSelectedItemForGap] = useState(null);
    const [selectedItemForDetails, setSelectedItemForDetails] = useState(null);

    useEffect(() => {
        // Show intro every time the component mounts
        setShowIntro(true);
    }, []);

    const fetchDashboardData = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            // Fetch metrics
            const metricsRes = await apiFetch(`/applications/student/${userId}/metrics`);
            if (metricsRes.ok) {
                const data = await metricsRes.json();
                setMetrics({
                    totalApplications: data.totalApplications || 0,
                    applied: data.applied || 0,
                    interviews: data.interviews || 0,
                    shortlisted: data.shortlisted || 0,
                    rejected: data.rejected || 0
                });
            }

            // Fetch applications
            const appsRes = await apiFetch(`/applications/student/${userId}`);
            if (appsRes.ok) {
                const appsData = await appsRes.json();
                setApplications(appsData);
            }

            // Fetch stored resume evaluation if it exists
            const resumeRes = await apiFetch(`/resume/student/${userId}`);
            if (resumeRes.ok) {
                const resumeResult = await resumeRes.json();
                setResumeData(resumeResult);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const [recommendedInternships, setRecommendedInternships] = useState([]);
    const [recommendedJobs, setRecommendedJobs] = useState([]);

    useEffect(() => {
        const fetchInternships = async () => {
            try {
                const response = await apiFetch('/internships');
                if (response.ok) {
                    const data = await response.json();

                    // Dynamically wire the NLP Extractions to the Algorithm Engine
                    // If no skills loaded yet, fallback to generic base
                    const studentSkills = (resumeData && resumeData.skills && resumeData.skills.length > 0) 
                        ? resumeData.skills 
                        : []; 

                    const processedData = data.map(internship => {
                        let matchPercentage = 0;
                        let reasons = [];
                        let matchedSkills = [];
                        let missingSkills = [];

                        if (internship.requiredSkills) {
                            const requiredSkillsArray = internship.requiredSkills.split(',').map(s => s.trim().toLowerCase());
                            const studentSkillsLower = studentSkills.map(s => s.toLowerCase());

                            matchedSkills = requiredSkillsArray.filter(reqSkill => studentSkillsLower.includes(reqSkill));
                            missingSkills = requiredSkillsArray.filter(reqSkill => !studentSkillsLower.includes(reqSkill));

                            if (requiredSkillsArray.length > 0) {
                                matchPercentage = Math.round((matchedSkills.length / requiredSkillsArray.length) * 100);
                            } else {
                                matchPercentage = 100; // No requirements means 100% match
                            }

                            if (matchedSkills.length > 0) {
                                reasons.push(`AI Verified: Matches ${matchedSkills.length}/${requiredSkillsArray.length} required skills`);
                            } else {
                                reasons.push(`Matches 0/${requiredSkillsArray.length} required skills`);
                            }
                        } else {
                            matchPercentage = 100; // Assuming 100% if no skills specified, or handle differently
                            reasons.push("No specific skills required");
                        }

                        return {
                            ...internship,
                            matchScore: matchPercentage,
                            reasons: reasons,
                            match: `${matchPercentage}%`, // For the UI
                            role: internship.roleTitle, // Assuming the backend returns 'position' for the role title. If not, change this.
                            matchedSkills: matchedSkills,
                            missingSkills: missingSkills
                        };
                    });

                    // Split and sort descending by matchScore
                    const internshipsArr = processedData.filter(i => i.type !== 'JOB').sort((a, b) => b.matchScore - a.matchScore);
                    const jobsArr = processedData.filter(i => i.type === 'JOB').sort((a, b) => b.matchScore - a.matchScore);

                    // Map all to show everything
                    setRecommendedInternships(internshipsArr);
                    setRecommendedJobs(jobsArr);
                } else {
                    console.error("Failed to fetch internships. Status:", response.status);
                }
            } catch (error) {
                console.error("Error fetching internships:", error);
            }
        };

        fetchInternships();
    }, [resumeData]); // Critical dependency on NLP AI data

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Interview': return { color: "#fff", bg: "#000" };
            case 'Shortlisted': return { color: "#fff", bg: "#000" };
            case 'Rejected': return { color: "#000", bg: "#eee" };
            case 'Applied': default: return { color: "#000", bg: "#fff" };
        }
    };

    const handleApply = async (internshipId) => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            setToast({ message: "No user ID found. Please log in.", type: "error" });
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        try {
            const response = await apiFetch('/applications', {
                method: 'POST',
                body: JSON.stringify({
                    student: { id: userId },
                    internship: { id: internshipId },
                    status: "Applied",
                    appliedDate: today
                })
            });

            if (response.ok) {
                setToast({ message: "Applied successfully!", type: "success" });
                fetchDashboardData(); // Refresh metrics and applications
            } else {
                setToast({ message: 'Application failed. Please try again later.', type: "error" });
            }
        } catch (error) {
            console.error('Error applying to internship:', error);
            setToast({ message: 'Application failed. Please check your connection.', type: "error" });
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!resumeFile) {
            setToast({ message: "Please select a PDF resume first.", type: "error" });
            return;
        }

        const userId = localStorage.getItem('userId');
        const formData = new FormData();
        formData.append('resume', resumeFile);
        formData.append('studentId', userId);

        setResumeLoading(true);
        setResumeData(null);

        try {
            const response = await apiFetch('/resume/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setResumeData(data);
                setToast({ message: "Resume parsed successfully!", type: "success" });
            } else {
                setToast({ message: 'Failed to evaluate resume.', type: "error" });
            }
        } catch (error) {
            console.error('Error uploading resume:', error);
            setToast({ message: 'Error processing your resume.', type: "error" });
        } finally {
            setResumeLoading(false);
        }
    };

    return (
        <div style={{ paddingTop: '110px', paddingLeft: '80px', paddingRight: '80px', paddingBottom: '80px', color: 'black', minHeight: '100vh', position: 'relative' }}>
            {/* Cinematic Zoom Into text Effect */}
            <AnimatePresence>
                {showIntro && (
                    <motion.div
                        initial={{ backgroundColor: '#fff' }}
                        animate={{ backgroundColor: 'rgba(255,255,255,0)' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, delay: 2.2, ease: 'easeOut' }}
                        onAnimationComplete={() => setShowIntro(false)}
                        style={{ 
                            position: 'fixed', 
                            inset: 0, 
                            zIndex: 9999, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            overflow: 'hidden',
                            pointerEvents: 'none' 
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: [0.8, 1, 80], opacity: [0, 1, 0] }}
                            transition={{ 
                                duration: 3, 
                                times: [0, 0.4, 1], 
                                ease: [0.4, 0, 0.2, 1]
                            }}
                            style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <h1 style={{ color: '#000', fontSize: '8vw', fontWeight: 900, whiteSpace: 'nowrap', letterSpacing: '20px', margin: 0 }}>
                                SIPP
                            </h1>
                            <p style={{ color: '#888', fontSize: '1.2vw', textTransform: 'uppercase', letterSpacing: '8px', marginTop: '10px' }}>
                                student internship and placement portal
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

            {/* 1. Header & Navigation Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-4 text-start"
            >
                <div className="d-flex justify-content-between align-items-end mb-4 border-bottom border-secondary pb-3">
                    <div>
                        <h1 className="fw-bold mb-2" style={{ fontSize: '2.5rem', letterSpacing: '-1px' }}>Dashboard</h1>
                        <p className="mb-0" style={{ fontSize: '1.1rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                            Welcome back. Manage your applications and profile here.
                        </p>
                    </div>
                    <div>
                        <button className="fw-bold" style={{ padding: '10px 20px', fontSize: '15px', background: 'transparent', border: '1px solid #000', color: '#000', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px' }}
                            onClick={handleLogout}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; }}
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tab Menu */}
                <div className="d-flex gap-2 overflow-auto" style={{ scrollbarWidth: 'none', paddingBottom: '10px' }}>
                    {['Overview', 'Resume Analyzer', 'Internal Applications'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: activeTab === tab ? '#000' : 'transparent',
                                color: activeTab === tab ? '#fff' : 'rgba(0,0,0,0.6)',
                                border: `1px solid ${activeTab === tab ? '#000' : '#ddd'}`,
                                padding: '10px 24px',
                                fontSize: '15px',
                                fontWeight: activeTab === tab ? '700' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => { 
                                if (activeTab !== tab) {
                                    e.currentTarget.style.color = '#000';
                                    e.currentTarget.style.borderColor = '#000';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (activeTab !== tab) {
                                    e.currentTarget.style.color = 'rgba(0,0,0,0.6)';
                                    e.currentTarget.style.borderColor = '#ddd';
                                }
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'Overview' && (
                <>
                <motion.div key="overview" className="row g-4 mt-4" variants={containerVariants} initial="hidden" animate="show">

                {/* 2. Metrics Section (Left Side - 8 cols) */}
                <div className="col-12 col-xl-8">
                    <div className="row g-4 h-100">
                        {/* Metric 1 */}
                        <motion.div className="col-12 col-md-4" variants={itemVariants} whileHover={{ scale: 1.03, y: -5 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                            <div className="universal-glass-card p-4 text-center h-100 d-flex flex-column justify-content-center" style={{ background: '#fff' }}>
                                <h2 className="fw-bold mb-1" style={{ fontSize: '3.5rem', color: '#000', letterSpacing: '2px' }}>
                                    {loading ? <span style={{ fontSize: '2rem' }}>Loading...</span> : <CountUpAnimation endValue={metrics.totalApplications} duration={1} />}
                                </h2>
                                <p className="mb-0" style={{ fontSize: '1.1rem', color: 'rgba(0, 0, 0, 0.6)', fontWeight: '600' }}>Total</p>
                            </div>
                        </motion.div>
                        {/* Metric 2 */}
                        <motion.div className="col-12 col-md-4" variants={itemVariants} whileHover={{ scale: 1.03, y: -5 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                            <div className="universal-glass-card p-4 text-center h-100 d-flex flex-column justify-content-center" style={{ background: '#fff' }}>
                                <h2 className="fw-bold mb-1" style={{ fontSize: '3.5rem', color: '#000', letterSpacing: '2px' }}>
                                    {loading ? <span style={{ fontSize: '2rem' }}>...</span> : <CountUpAnimation endValue={metrics.applied} duration={1} />}
                                </h2>
                                <p className="mb-0" style={{ fontSize: '1.1rem', color: 'rgba(0, 0, 0, 0.6)', fontWeight: '600' }}>Applied</p>
                            </div>
                        </motion.div>
                        {/* Metric 3 */}
                        <motion.div className="col-12 col-md-4" variants={itemVariants} whileHover={{ scale: 1.03, y: -5 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                            <div className="universal-glass-card p-4 text-center h-100 d-flex flex-column justify-content-center" style={{ background: '#fff' }}>
                                <h2 className="fw-bold mb-1" style={{ fontSize: '3.5rem', color: '#000', letterSpacing: '2px' }}>
                                    {loading ? <span style={{ fontSize: '2rem' }}>...</span> : <CountUpAnimation endValue={metrics.interviews} duration={1} />}
                                </h2>
                                <p className="mb-0" style={{ fontSize: '1.1rem', color: 'rgba(0, 0, 0, 0.6)', fontWeight: '600' }}>Interviews</p>
                            </div>
                        </motion.div>
                        {/* Metric 4 */}
                        <motion.div className="col-12 col-md-6" variants={itemVariants} whileHover={{ scale: 1.03, y: -5 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                            <div className="universal-glass-card p-4 text-center h-100 d-flex flex-column justify-content-center" style={{ background: '#fff' }}>
                                <h2 className="fw-bold mb-1" style={{ fontSize: '3.5rem', color: '#000', letterSpacing: '2px' }}>
                                    {loading ? <span style={{ fontSize: '2rem' }}>...</span> : <CountUpAnimation endValue={metrics.shortlisted} duration={1} />}
                                </h2>
                                <p className="mb-0" style={{ fontSize: '1.1rem', color: 'rgba(0, 0, 0, 0.6)', fontWeight: '600' }}>Shortlisted</p>
                            </div>
                        </motion.div>
                        {/* Metric 5 */}
                        <motion.div className="col-12 col-md-6" variants={itemVariants} whileHover={{ scale: 1.03, y: -5 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                            <div className="universal-glass-card p-4 text-center h-100 d-flex flex-column justify-content-center" style={{ background: '#fff' }}>
                                <h2 className="fw-bold mb-1" style={{ fontSize: '3.5rem', color: '#000', letterSpacing: '2px' }}>
                                    {loading ? <span style={{ fontSize: '2rem' }}>...</span> : <CountUpAnimation endValue={metrics.rejected} duration={1} />}
                                </h2>
                                <p className="mb-0" style={{ fontSize: '1.1rem', color: 'rgba(0, 0, 0, 0.6)', fontWeight: '600' }}>Rejected</p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* 3. & 7. Side Panels (Right Side - 4 cols) */}
                <div className="col-12 col-xl-4 d-flex flex-column gap-4">
                    {/* 3. Profile Strength Panel Calculation */}
                    {(() => {
                        // Dynamically calculate Profile Strength based on the AI Evaluation
                        let profileStrength = 20; // Base Account Creation Value
                        let metricsObj = { resume: false, skills: false, experience: false, summary: false };

                        if (resumeData) {
                            profileStrength += 30; // Resume is uploaded
                            metricsObj.resume = true;

                            if (resumeData.skills && resumeData.skills.length > 0) {
                                profileStrength += 20;
                                metricsObj.skills = true;
                            }
                            if (resumeData.organizations && resumeData.organizations.length > 0) {
                                profileStrength += 20;
                                metricsObj.experience = true;
                            }
                            if (resumeData.summary && !resumeData.summary.includes("No distinct summary")) {
                                profileStrength += 10;
                                metricsObj.summary = true;
                            }
                        }

                        return (
                            <motion.div className="universal-glass-card p-4 flex-grow-1" variants={itemVariants}>
                                <div className="d-flex justify-content-between align-items-baseline">
                                    <h3 className="fw-bold mb-0" style={{ fontSize: '1.3rem' }}>Profile Strength</h3>
                                    <span className="fw-bold fs-4 text-dark">
                                        <CountUpAnimation endValue={profileStrength} duration={1} />%
                                    </span>
                                </div>
                                <ProgressBar targetPercentage={profileStrength} />

                                <div className="d-flex flex-column gap-2 mt-3" style={{ fontSize: '0.95rem' }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span style={{ color: metricsObj.resume ? '#000' : '#aaa', fontSize: '0.9rem', fontWeight: 'bold' }}>{metricsObj.resume ? 'Yes' : 'No '}</span> 
                                        <span style={{ color: metricsObj.resume ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)' }}>Resume Uploaded</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <span style={{ color: metricsObj.skills ? '#000' : '#aaa', fontSize: '0.9rem', fontWeight: 'bold' }}>{metricsObj.skills ? 'Yes' : 'No '}</span> 
                                        <span style={{ color: metricsObj.skills ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)' }}>Skills Linked</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <span style={{ color: metricsObj.experience ? '#000' : '#aaa', fontSize: '0.9rem', fontWeight: 'bold' }}>{metricsObj.experience ? 'Yes' : 'No '}</span> 
                                        <span style={{ color: metricsObj.experience ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)' }}>Industry Experience</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <span style={{ color: metricsObj.summary ? '#000' : '#aaa', fontSize: '0.9rem', fontWeight: 'bold' }}>{metricsObj.summary ? 'Yes' : 'No '}</span> 
                                        <span style={{ color: metricsObj.summary ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)' }}>Professional Summary</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })()}

                    {/* AI Extracted Skills Panel */}
                    <motion.div className="universal-glass-card p-4 mt-4" variants={itemVariants}>
                        <h3 className="fw-bold mb-3" style={{ fontSize: '1.2rem' }}>AI Verified Skills</h3>
                        {resumeData && resumeData.skills && resumeData.skills.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                                {resumeData.skills.map((skill, idx) => (
                                    <span key={idx} className="badge" style={{ backgroundColor: '#000', color: '#fff', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '8px', border: '1px solid #000' }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-3" style={{ background: 'rgba(0,0,0,0.04)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.2)' }}>
                                <p style={{ color: 'rgba(0,0,0,0.6)', margin: 0, fontSize: '0.95rem' }}>Upload your resume in the Analyzer module to automatically unlock and display your skill vectors.</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
            
            {/* Internships Recommended */}
            <motion.div className="mb-5 mt-4" initial="hidden" animate="show" variants={containerVariants}>
                <h3 className="fw-bold mb-4" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>Top Internship Matches</h3>
                <div className="row g-4">
                    {recommendedInternships.length > 0 ? recommendedInternships.map((internship, index) => (
                        <motion.div key={index} className="col-12 col-md-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5 }} transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}>
                            <div className="universal-glass-card p-4 h-100 d-flex flex-column" style={{ background: '#fff' }}>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h4 className="fw-bold mb-0" style={{ fontSize: '1.3rem' }}>{internship.companyName || 'Unknown Company'}</h4>
                                    <span className="badge" style={{ border: '1px solid #000', color: '#000', padding: '6px 10px', fontWeight: '500' }}>{internship.match} Match</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <p className="mb-0" style={{ color: 'rgba(0,0,0,0.9)', fontSize: '1.05rem', fontWeight: '500' }}>{internship.role || 'Untitled Role'}</p>
                                    <button onClick={() => setSelectedItemForDetails(internship)} style={{ background: 'none', border: 'none', color: '#000', textDecoration: 'underline', fontSize: '0.9rem', padding: 0, cursor: 'pointer' }}>View Details</button>
                                </div>
                                <div className="flex-grow-1 mb-4" style={{ fontSize: '0.9rem', color: 'rgba(0,0,0,0.6)' }}>
                                    <ul className="ps-3 mb-0 d-flex flex-column gap-1" style={{ listStyleType: 'circle' }}>
                                        {internship.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                                    </ul>
                                </div>
                                <div className="mt-auto d-flex flex-column gap-2">
                                    <button className="w-100" style={{ padding: '10px', fontSize: '14px', background: 'transparent', border: '1px solid currentColor', color: '#d32f2f', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px', fontWeight: 'bold' }}
                                        onClick={() => setSelectedItemForGap(internship)}
                                        onMouseOver={(e) => { e.currentTarget.style.background = '#d32f2f'; e.currentTarget.style.color = '#fff'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d32f2f'; }}
                                    >
                                        Analyze Skill Gaps
                                    </button>
                                    {(() => {
                                        const hasApplied = applications.some(app => app.internship?.id === internship.id);
                                        return (
                                            <button className="w-100" style={{ padding: '10px', fontSize: '14px', background: hasApplied ? '#eee' : '#fff', border: hasApplied ? '1px solid #ccc' : '1px solid #000', color: hasApplied ? '#888' : '#000', cursor: hasApplied ? 'not-allowed' : 'pointer', transition: 'all 0.3s', borderRadius: '12px' }} onClick={() => !hasApplied && handleApply(internship.id)} onMouseOver={(e) => { if (!hasApplied) { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; } }} onMouseOut={(e) => { if (!hasApplied) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; } }} disabled={hasApplied}>
                                                {hasApplied ? 'Applied ✓' : 'Apply Now'}
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="col-12"><div className="universal-glass-card p-4 text-center"><p className="mb-0" style={{ color: 'rgba(0,0,0,0.6)' }}>No suitable internships found based on your skill vector.</p></div></div>
                    )}
                </div>
            </motion.div>

            {/* Jobs Recommended */}
            <motion.div className="mb-4 mt-4" initial="hidden" animate="show" variants={containerVariants}>
                <h3 className="fw-bold mb-4" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>Top Full-Time Job Offers</h3>
                <div className="row g-4">
                    {recommendedJobs.length > 0 ? recommendedJobs.map((job, index) => (
                        <motion.div key={index} className="col-12 col-md-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5 }} transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}>
                            <div className="universal-glass-card p-4 h-100 d-flex flex-column" style={{ background: '#fff' }}>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h4 className="fw-bold mb-0" style={{ fontSize: '1.3rem' }}>{job.companyName || 'Unknown Company'}</h4>
                                    <span className="badge" style={{ border: '1px solid #000', color: '#000', padding: '6px 10px', fontWeight: '500' }}>{job.match} Match</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <p className="mb-0" style={{ color: 'rgba(0,0,0,0.9)', fontSize: '1.05rem', fontWeight: '500' }}>{job.role || 'Untitled Role'}</p>
                                    <button onClick={() => setSelectedItemForDetails(job)} style={{ background: 'none', border: 'none', color: '#000', textDecoration: 'underline', fontSize: '0.9rem', padding: 0, cursor: 'pointer' }}>View Details</button>
                                </div>
                                <div className="flex-grow-1 mb-4" style={{ fontSize: '0.9rem', color: 'rgba(0,0,0,0.6)' }}>
                                    <ul className="ps-3 mb-0 d-flex flex-column gap-1" style={{ listStyleType: 'circle' }}>
                                        {job.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                                    </ul>
                                </div>
                                <div className="mt-auto d-flex flex-column gap-2">
                                    <button className="w-100" style={{ padding: '10px', fontSize: '14px', background: 'transparent', border: '1px solid currentColor', color: '#d32f2f', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px', fontWeight: 'bold' }}
                                        onClick={() => setSelectedItemForGap(job)}
                                        onMouseOver={(e) => { e.currentTarget.style.background = '#d32f2f'; e.currentTarget.style.color = '#fff'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d32f2f'; }}
                                    >
                                        Analyze Skill Gaps
                                    </button>
                                    {(() => {
                                        const hasApplied = applications.some(app => app.internship?.id === job.id);
                                        return (
                                            <button className="w-100" style={{ padding: '10px', fontSize: '14px', background: hasApplied ? '#eee' : '#fff', border: hasApplied ? '1px solid #ccc' : '1px solid #000', color: hasApplied ? '#888' : '#000', cursor: hasApplied ? 'not-allowed' : 'pointer', transition: 'all 0.3s', borderRadius: '12px' }} onClick={() => !hasApplied && handleApply(job.id)} onMouseOver={(e) => { if (!hasApplied) { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; } }} onMouseOut={(e) => { if (!hasApplied) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; } }} disabled={hasApplied}>
                                                {hasApplied ? 'Applied ✓' : 'Apply Now'}
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="col-12"><div className="universal-glass-card p-4 text-center"><p className="mb-0" style={{ color: 'rgba(0,0,0,0.6)' }}>No suitable full-time jobs found based on your skill vector.</p></div></div>
                    )}
                </div>
            </motion.div>
                </>
            )}

            {/* TAB CONTENT: RESUME ANALYZER */}
            {activeTab === 'Resume Analyzer' && (
                <motion.div key="resume" className="mt-4" variants={containerVariants} initial="hidden" animate="show">
                    <div className="row g-4">
                        <div className="col-12 col-xl-5">
                            <motion.div className="universal-glass-card p-4 h-100" variants={itemVariants}>
                                <h3 className="fw-bold mb-4" style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Upload Resume</h3>
                                <p style={{ fontSize: '1rem', color: 'rgba(0,0,0,0.6)', marginBottom: '25px' }}>
                                    Upload your professional resume (strictly PDF). Our integrated spaCy NLP model will scan it and extract analytical scores, skills, and entities.
                                </p>
                                
                                <form onSubmit={handleFileUpload} className="d-flex flex-column gap-4">
                                    <div className="border p-4 text-center d-flex flex-column gap-3 justify-content-center align-items-center" style={{ borderColor: '#ddd', borderRadius: '12px', minHeight: '150px', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                        <input 
                                            type="file" 
                                            accept=".pdf"
                                            onChange={(e) => setResumeFile(e.target.files[0])}
                                            style={{ color: '#000' }}
                                        />
                                        <span style={{ fontSize: '0.85rem', color: '#666' }}>Accepted formats: .pdf</span>
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="text-center" 
                                        disabled={resumeLoading}
                                        style={{ 
                                            background: resumeLoading ? '#eee' : '#000', 
                                            color: resumeLoading ? '#888' : '#fff', 
                                            pointerEvents: resumeLoading ? 'none' : 'auto',
                                            padding: '14px', 
                                            fontSize: '15px', 
                                            fontWeight: 'bold', 
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            border: resumeLoading ? '1px solid #ccc' : '1px solid #000',
                                            borderRadius: '12px'
                                        }}
                                    >
                                        {resumeLoading ? 'Evaluating AI Model...' : 'Trigger NLP Analysis'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                        
                        <div className="col-12 col-xl-7">
                            <motion.div className="universal-glass-card p-4 h-100" variants={itemVariants}>
                                <h3 className="fw-bold mb-4" style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Evaluation Report</h3>
                                
                                {!resumeData && !resumeLoading && (
                                    <div className="h-100 d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                                        <p style={{ color: '#aaa', fontSize: '1.1rem' }}>No data... Waiting for upload.</p>
                                    </div>
                                )}

                                {resumeLoading && (
                                    <div className="h-100 d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                                        <p className="pulse-text" style={{ color: '#000', fontSize: '1.1rem' }}>Parsing text matrix...</p>
                                    </div>
                                )}

                                {resumeData && !resumeLoading && (
                                    <div className="d-flex flex-column gap-4">
                                        <div>
                                            <h5 className="fw-bold" style={{ color: '#666' }}>Extracted Summary</h5>
                                            <p style={{ lineHeight: '1.6', fontSize: '1rem', color: '#000', padding: '15px', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '12px' }}>
                                                {resumeData.summary || "No adequate summary parsed."}
                                            </p>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-12 col-md-6">
                                                <h5 className="fw-bold mb-2" style={{ color: '#666' }}>Entity: Verified Skills</h5>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {resumeData.skills && resumeData.skills.length > 0 ? resumeData.skills.map((s, idx) => (
                                                        <span key={idx} className="badge" style={{ backgroundColor: '#000', color: '#fff', fontSize: '0.85rem', padding: '6px 10px', borderRadius: '8px' }}>{s}</span>
                                                    )) : <span style={{ color: '#aaa' }}>No known skills found</span>}
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <h5 className="fw-bold mb-2" style={{ color: '#666' }}>Entity: Organizations</h5>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {resumeData.organizations && resumeData.organizations.length > 0 ? resumeData.organizations.map((org, idx) => (
                                                        <span key={idx} className="badge" style={{ backgroundColor: '#f0f0f0', color: '#000', fontSize: '0.85rem', border: '1px solid #ddd', padding: '6px 10px', borderRadius: '8px' }}>{org}</span>
                                                    )) : <span style={{ color: '#aaa' }}>None located</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                             <h5 className="fw-bold mb-2" style={{ color: '#666' }}>Entity: Geopolitical Locations</h5>
                                             <div className="d-flex flex-wrap gap-2">
                                                 {resumeData.locations && resumeData.locations.length > 0 ? resumeData.locations.map((loc, idx) => (
                                                     <span key={idx} style={{ color: '#000', textDecoration: 'underline', fontSize: '0.9rem' }}>{loc}</span>
                                                 )) : <span style={{ color: '#aaa' }}>None located</span>}
                                             </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* TAB CONTENT: APPLICATIONS */}
            {activeTab === 'Internal Applications' && (
            <motion.div key="applications" className="mt-4 d-flex flex-column gap-5" variants={containerVariants} initial="hidden" animate="show">
                <h3 className="fw-bold mb-4" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>Application Tracking</h3>
                <motion.div className="universal-glass-card overflow-hidden" variants={itemVariants}>
                    <div className="table-responsive">
                        <table className="table table-borderless mb-0" style={{ color: 'black' }}>
                            <thead style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                <tr>
                                    <th className="fw-bold py-3 px-4" style={{ color: 'rgba(0,0,0,0.6)', background: 'transparent' }}>Company</th>
                                    <th className="fw-bold py-3 px-4" style={{ color: 'rgba(0,0,0,0.6)', background: 'transparent' }}>Role</th>
                                    <th className="fw-bold py-3 px-4" style={{ color: 'rgba(0,0,0,0.6)', background: 'transparent' }}>Status</th>
                                    <th className="fw-bold py-3 px-4" style={{ color: 'rgba(0,0,0,0.6)', background: 'transparent' }}>Applied Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app, idx) => {
                                    const statusConfig = getStatusConfig(app.status);
                                    return (
                                        <tr key={idx} style={{ borderBottom: idx !== applications.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', transition: 'background-color 0.3s' }} className="table-row-hover">
                                            <td className="py-3 px-4 fw-bold align-middle" style={{ background: 'transparent' }}>{app.internship?.company || 'Unknown'}</td>
                                            <td className="py-3 px-4 align-middle" style={{ background: 'transparent', color: 'rgba(0,0,0,0.9)' }}>{app.internship?.position || 'Unknown'}</td>
                                            <td className="py-3 px-4 align-middle" style={{ background: 'transparent' }}>
                                                <span className="badge rounded-pill" style={{ backgroundColor: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.bg}`, padding: '6px 14px', fontWeight: '500' }}>
                                                    {app.status || 'Applied'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 align-middle" style={{ background: 'transparent', color: 'rgba(0,0,0,0.5)' }}>{app.appliedDate || 'No date'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Embedded style for table hover since we can't easily inline pseudoclasses */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .table-row-hover:hover {
                        background-color: rgba(0,0,0,0.03) !important;
                    }
                `}} />
            </motion.div>

            )}

            {/* Skill Gap Modal Overlay */}
            <AnimatePresence>
                {selectedItemForGap && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                        onClick={() => setSelectedItemForGap(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="universal-glass-card p-4 d-flex flex-column"
                            style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-4 flex-shrink-0">
                                <div>
                                    <h3 className="fw-bold mb-1" style={{ fontSize: '1.5rem', color: '#000' }}>Skill Gap Analysis</h3>
                                    <p className="mb-0" style={{ color: 'rgba(0,0,0,0.6)' }}>{selectedItemForGap.role} at {selectedItemForGap.companyName}</p>
                                </div>
                                <button type="button" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.4)', color: 'black', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedItemForGap(null)}>✕</button>
                            </div>
                            
                            <div className="flex-grow-1 overflow-auto pe-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.2) transparent' }}>
                                {/* Verified Skills */}
                                <h5 className="fw-bold mb-3" style={{ color: '#000' }}>Verified Skills</h5>
                                <div className="d-flex flex-wrap gap-2 mb-4">
                                    {selectedItemForGap.matchedSkills && selectedItemForGap.matchedSkills.length > 0 ? selectedItemForGap.matchedSkills.map((skill, idx) => (
                                        <span key={idx} className="badge" style={{ backgroundColor: '#000', color: '#fff', fontSize: '0.9rem', padding: '8px 12px', borderRadius: '8px' }}>
                                            {skill} ✓
                                        </span>
                                    )) : <span style={{ color: 'rgba(0,0,0,0.6)' }}>None of the required skills were detected.</span>}
                                </div>

                                {/* Missing Skills */}
                                <h5 className="fw-bold mb-3" style={{ color: '#d32f2f' }}>Missing Skills (Action Required)</h5>
                                <div className="d-flex flex-column gap-3">
                                    {selectedItemForGap.missingSkills && selectedItemForGap.missingSkills.length > 0 ? selectedItemForGap.missingSkills.map((skill, idx) => {
                                        const resource = learningResources[skill.toLowerCase()];
                                        return (
                                            <div key={idx} className="d-flex justify-content-between align-items-center p-3" style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', background: 'rgba(0,0,0,0.02)' }}>
                                                <div>
                                                    <span className="fw-bold d-block" style={{ color: '#d32f2f', fontSize: '1rem', textTransform: 'capitalize' }}>Missing: {skill}</span>
                                                    <p className="mb-0" style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)' }}>
                                                        {resource ? resource.title : `Search for fundamentals of ${skill}`}
                                                    </p>
                                                </div>
                                                {resource ? (
                                                    <a href={resource.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '13px', background: '#000', border: '1px solid #000', color: '#fff', borderRadius: '12px', transition: 'all 0.3s' }}>
                                                        Learn ↗
                                                    </a>
                                                ) : (
                                                    <a href={`https://www.youtube.com/results?search_query=${skill}+tutorial`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '13px', background: 'transparent', border: '1px solid #000', color: '#000', borderRadius: '12px', transition: 'all 0.3s' }}>
                                                        Search ↗
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    }) : <span style={{ color: 'rgba(0,0,0,0.6)' }}>You meet all listed skill requirements!</span>}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Details Modal Overlay */}
            <AnimatePresence>
                {selectedItemForDetails && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                        onClick={() => setSelectedItemForDetails(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="universal-glass-card p-4 d-flex flex-column"
                            style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-4 flex-shrink-0">
                                <div>
                                    <h3 className="fw-bold mb-1" style={{ fontSize: '1.5rem', color: '#000' }}>Opportunity Details</h3>
                                    <p className="mb-0" style={{ color: 'rgba(0,0,0,0.6)' }}>{selectedItemForDetails.role} at {selectedItemForDetails.companyName}</p>
                                </div>
                                <button type="button" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.4)', color: 'black', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedItemForDetails(null)}>✕</button>
                            </div>
                            
                            <div className="flex-grow-1 overflow-auto pe-2 d-flex flex-column gap-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.2) transparent' }}>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="fw-bold">Company:</span> <span>{selectedItemForDetails.companyName}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="fw-bold">Location:</span> <span>{selectedItemForDetails.location || "Remote"}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="fw-bold">Stipend/Salary:</span> <span>{selectedItemForDetails.stipend || "Unpaid"}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="fw-bold">CGPA Req:</span> <span>{selectedItemForDetails.cgpaLimit || "0"}/10</span>
                                </div>
                                <div>
                                    <span className="fw-bold d-block mb-1">Eligible Departments:</span>
                                    {selectedItemForDetails.eligibleDepts ? (
                                        <div className="d-flex flex-wrap gap-2">
                                            {selectedItemForDetails.eligibleDepts.split(',').map((dept, idx) => (
                                                <span key={idx} className="badge bg-dark fw-normal">{dept}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{color: 'rgba(0,0,0,0.6)'}}>All Departments</span>
                                    )}
                                </div>
                                <div>
                                    <span className="fw-bold d-block mb-1">Description:</span>
                                    <p style={{ color: 'rgba(0,0,0,0.8)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                        {selectedItemForDetails.description || "No description provided."}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default StudentDashboard;
