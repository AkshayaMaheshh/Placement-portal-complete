import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '../components/Toast';
import { apiFetch, downloadResumePdf, fetchStudentResumeData } from '../services/api';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentActivity, setStudentActivity] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [activityLoading, setActivityLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Creative Features State ---
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
    const [spotlightQuery, setSpotlightQuery] = useState('');

    const [data, setData] = useState({
        totalStudents: 0,
        totalCompanies: 0,
        totalOpportunities: 0,
        totalPlacements: 0,
        students: [],
        companies: [],
        applications: []
    });

    const [toast, setToast] = useState({ message: '', type: '' });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSpotlightOpen(prev => !prev);
                setSpotlightQuery('');
            }
            if (e.key === 'Escape') {
                setIsSpotlightOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleViewResume = async (studentId) => {
        try {
            setToast({ message: "Opening resume...", type: 'info' });
            await downloadResumePdf(studentId);
        } catch (error) {
            setToast({ message: "No resume found or failed to load.", type: 'error' });
        }
    };

    const handleMonitorActivity = async (student) => {
        setSelectedStudent(student);
        setShowModal(true);
        setActivityLoading(true);
        try {
            const resumeData = await fetchStudentResumeData(student.id);
            setStudentActivity(resumeData);
        } catch (error) {
            console.error("No resume data found for this student");
            setStudentActivity(null);
        } finally {
            setActivityLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const fetchAdminData = async () => {
        try {
            const response = await apiFetch(`/admin/dashboard?t=${new Date().getTime()}`);
            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                setToast({ message: "Failed to fetch admin data", type: 'error' });
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
            setToast({ message: "Error connecting to server", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
    };

    const filteredStudents = data.students.filter(student => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const inName = student.name && student.name.toLowerCase().includes(term);
        const inEmail = student.email && student.email.toLowerCase().includes(term);
        const inSkills = student.skills && student.skills.some(skill => skill.toLowerCase().includes(term));
        return inName || inEmail || inSkills;
    });

    // --- Derived Analytics Logic ---
    const calculateTopSkills = () => {
        const skillCounts = {};
        data.students.forEach(student => {
            if (student.skills && student.skills.length > 0) {
                student.skills.forEach(skill => {
                    const s = skill.trim().toUpperCase();
                    if(s) skillCounts[s] = (skillCounts[s] || 0) + 1;
                });
            }
        });
        return Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
    };
    const topSkills = calculateTopSkills();
    const placementRate = data.totalStudents > 0 ? Math.round((data.totalPlacements / data.totalStudents) * 100) : 0;
    const recentActivity = data.applications.slice(0, 5);

    // Spotlight search logic
    const spotlightResults = () => {
        if (!spotlightQuery) return [];
        const term = spotlightQuery.toLowerCase();
        const sResults = data.students.filter(s => s.name?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term) || s.skills?.some(skill => skill.toLowerCase().includes(term))).map(s => ({...s, type: 'Student'}));
        const cResults = data.companies.filter(c => c.name?.toLowerCase().includes(term)).map(c => ({...c, type: 'Company'}));
        return [...sResults, ...cResults].slice(0, 8);
    };

    return (
        <div style={{ paddingTop: '110px', paddingLeft: '80px', paddingRight: '80px', paddingBottom: '80px', color: 'black' }}>
            
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="d-flex justify-content-between align-items-center mb-5"
            >
                <div className="text-start">
                    <h1 className="fw-bold" style={{ fontSize: '2.5rem', letterSpacing: '-1px' }}>Faculty Portal</h1>
                    <p style={{ fontSize: '1.1rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                        Overview of student placements, company postings, and system activity.
                    </p>
                </div>
                <div className="d-flex gap-3 align-items-center">
                    <button className="d-flex align-items-center gap-2" style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', cursor: 'text', color: 'rgba(0,0,0,0.6)', transition: 'all 0.2s' }} onClick={() => setIsSpotlightOpen(true)} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}>
                        <span style={{ fontSize: '1.1rem' }}>🔍</span> Search... <kbd style={{ background: '#fff', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid #ddd', fontFamily: 'inherit', fontWeight: 'bold' }}>Ctrl K</kbd>
                    </button>
                    <button className="fw-bold" style={{ padding: '12px 24px', fontSize: '15px', background: 'transparent', border: '1px solid #000', color: '#000', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px' }}
                        onClick={handleLogout}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; }}
                    >
                        Logout
                    </button>
                </div>
            </motion.div>

            {/* Live Pulse Ticker */}
            {recentActivity.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 overflow-hidden" style={{ background: 'linear-gradient(90deg, #000, #222)', color: '#fff', padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', whiteSpace: 'nowrap' }}>
                    <div style={{ width: '8px', height: '8px', background: '#0f0', borderRadius: '50%', boxShadow: '0 0 10px #0f0', animation: 'pulse 1.5s infinite' }} />
                    <span className="fw-bold" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Live Pulse</span>
                    <marquee behavior="scroll" direction="left" scrollamount="5" style={{ flexGrow: 1, margin: 0, padding: 0 }}>
                        {recentActivity.map((app, i) => (
                            <span key={i} style={{ marginRight: '50px', fontSize: '0.95rem' }}>
                                <strong>{app.student?.name}</strong> {app.status === 'Selected' ? '🎉 was selected for' : '⚡ applied for'} <strong>{app.internship?.roleTitle}</strong> at <strong>{app.internship?.companyName}</strong>
                            </span>
                        ))}
                    </marquee>
                    <style>{`@keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 255, 0, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 0, 0); } }`}</style>
                </motion.div>
            )}

            {/* Tab Menu */}
            <div className="d-flex gap-2 mb-4 overflow-auto">
                {['Overview', 'Students', 'Companies', 'Activity Feed'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? '#000' : 'transparent', color: activeTab === tab ? '#fff' : 'rgba(0,0,0,0.6)', border: `1px solid ${activeTab === tab ? '#000' : '#ddd'}`, padding: '10px 24px', fontSize: '15px', fontWeight: activeTab === tab ? '700' : '500', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center mt-5"><span style={{ fontSize: '1.2rem', color: 'rgba(0,0,0,0.6)' }}>Loading analytics...</span></div>
            ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="show">
                    
                    {activeTab === 'Overview' && (
                        <div className="row g-4">
                            {[
                                { label: 'Total Students', value: data.totalStudents },
                                { label: 'Companies Joined', value: data.totalCompanies },
                                { label: 'Active Opportunities', value: data.totalOpportunities },
                                { label: 'Placements Activity', value: data.totalPlacements }
                            ].map((stat, idx) => (
                                <motion.div key={idx} className="col-12 col-md-3" initial="hidden" animate="show" variants={itemVariants}>
                                    <div className="universal-glass-card p-4 text-center" style={{ background: '#fff' }}>
                                        <h2 className="fw-bold mb-1" style={{ fontSize: '3rem', color: '#000' }}>{stat.value}</h2>
                                        <p className="mb-0 fw-semibold" style={{ color: 'rgba(0,0,0,0.5)' }}>{stat.label}</p>
                                    </div>
                                </motion.div>
                            ))}
                            
                            {/* Analytics Enhancements */}
                            <div className="col-12 mt-4">
                                <div className="row g-4">
                                    {/* Success Rate Ring */}
                                    <div className="col-md-4">
                                        <div className="universal-glass-card p-4 d-flex flex-column align-items-center justify-content-center h-100" style={{ background: '#fff' }}>
                                            <h4 className="fw-bold mb-4" style={{ color: '#000', alignSelf: 'flex-start' }}>Placement Rate</h4>
                                            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                                                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                                                    <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eee" strokeWidth="3" />
                                                    <motion.path 
                                                        strokeDasharray={`${placementRate}, 100`} 
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                                        fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" 
                                                        initial={{ strokeDasharray: '0, 100' }}
                                                        animate={{ strokeDasharray: `${placementRate}, 100` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                    />
                                                </svg>
                                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                                    <span className="fw-bold" style={{ fontSize: '2rem' }}>{placementRate}%</span>
                                                </div>
                                            </div>
                                            <p className="mt-4 mb-0 text-center" style={{ color: 'rgba(0,0,0,0.5)', fontSize: '0.9rem' }}>Based on successful interviews and selections</p>
                                        </div>
                                    </div>
                                    
                                    {/* Skill Cloud */}
                                    <div className="col-md-8">
                                        <div className="universal-glass-card p-4 h-100 d-flex flex-column" style={{ background: '#fff' }}>
                                            <h4 className="fw-bold mb-4" style={{ color: '#000' }}>Trending Skills Matrix</h4>
                                            <div className="d-flex flex-wrap gap-3 align-items-center justify-content-center flex-grow-1 pb-4">
                                                {topSkills.length > 0 ? topSkills.map(([skill, count], idx) => {
                                                    const fontSize = Math.max(0.8, Math.min(2.5, 0.8 + (count * 0.2)));
                                                    const opacity = Math.max(0.4, Math.min(1, 0.4 + (count * 0.1)));
                                                    return (
                                                        <motion.span 
                                                            key={idx} 
                                                            initial={{ opacity: 0, scale: 0.5 }}
                                                            animate={{ opacity, scale: 1 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            style={{ fontSize: `${fontSize}rem`, fontWeight: 'bold', color: '#000', cursor: 'default' }}
                                                            whileHover={{ scale: 1.1, opacity: 1, textShadow: '0px 5px 15px rgba(0,0,0,0.2)' }}
                                                        >
                                                            {skill}
                                                        </motion.span>
                                                    )
                                                }) : <span style={{ color: 'rgba(0,0,0,0.5)' }}>Not enough data to generate skill matrix.</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Students' && (
                        <div className="universal-glass-card p-4 overflow-hidden">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="fw-bold mb-0">Registered Students</h3>
                                <input 
                                    type="text" 
                                    placeholder="Search by name, email, or skill (e.g. React)..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-control w-auto" 
                                    style={{ background: '#f8f8f8', border: '1px solid #ddd', borderRadius: '10px', padding: '10px 15px', minWidth: '300px', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div className="table-responsive">
                                <table className="table table-borderless align-middle mb-0">
                                    <thead className="border-bottom">
                                        <tr style={{ color: 'rgba(0,0,0,0.6)' }}>
                                            <th className="py-3 px-4">Name</th>
                                            <th className="py-3 px-4">Top Skills</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => (
                                            <tr key={idx} className="border-bottom border-light">
                                                <td className="py-3 px-4">
                                                    <span className="fw-bold d-block text-dark">{student.name}</span>
                                                    <span style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.5)' }}>{student.email}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {student.skills && student.skills.length > 0 ? (
                                                            student.skills.slice(0, 3).map((s, i) => (
                                                                <span key={i} style={{ backgroundColor: '#f0f0f0', color: '#333', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>{s}</span>
                                                            ))
                                                        ) : (
                                                            <span style={{ color: '#aaa', fontSize: '0.8rem' }}>No skills extracted</span>
                                                        )}
                                                        {student.skills && student.skills.length > 3 && <span style={{ padding: '4px', fontSize: '0.75rem', color: '#888' }}>+{student.skills.length - 3}</span>}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="badge" style={{ backgroundColor: '#000', color: '#fff', padding: '6px 12px', borderRadius: '8px' }}>Active</span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button onClick={() => handleViewResume(student.id)} className="btn btn-sm me-2" style={{ border: '1px solid #000', backgroundColor: 'transparent', color: '#000', borderRadius: '6px', fontSize: '0.8rem', padding: '6px 10px' }}>View Resume</button>
                                                    <button onClick={() => handleMonitorActivity(student)} className="btn btn-sm" style={{ background: '#000', color: '#fff', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #000', padding: '6px 10px' }}>Monitor</button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-5" style={{ color: 'rgba(0,0,0,0.5)' }}>No students match your search.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Companies' && (
                        <div className="universal-glass-card p-4 overflow-hidden">
                            <h3 className="fw-bold mb-4">Corporate Partners</h3>
                            <div className="table-responsive">
                                <table className="table table-borderless align-middle mb-0">
                                    <thead className="border-bottom">
                                        <tr style={{ color: 'rgba(0,0,0,0.6)' }}>
                                            <th className="py-3 px-4">Company Name</th>
                                            <th className="py-3 px-4">Email</th>
                                            <th className="py-3 px-4">Engagement</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.companies.map((company, idx) => (
                                            <tr key={idx} className="border-bottom border-light">
                                                <td className="py-3 px-4 fw-bold">{company.name}</td>
                                                <td className="py-3 px-4" style={{ color: 'rgba(0,0,0,0.7)' }}>{company.email}</td>
                                                <td className="py-3 px-4">
                                                    <span className="badge" style={{ background: 'transparent', border: '1px solid #000', color: '#000', padding: '6px 12px', borderRadius: '8px' }}>Verified</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Activity Feed' && (
                        <div className="universal-glass-card p-4 overflow-hidden">
                            <h3 className="fw-bold mb-4">Global Activity Feed</h3>
                            <div className="timeline-container px-2">
                                {data.applications.length > 0 ? data.applications.map((app, idx) => (
                                    <motion.div initial="hidden" animate="show" variants={itemVariants} key={idx} className="d-flex mb-4 position-relative">
                                        <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: app.status === 'Selected' ? '#000' : '#ccc', marginTop: '5px', flexShrink: 0, position: 'relative', zIndex: 2 }}></div>
                                        {idx !== data.applications.length - 1 && <div style={{ position: 'absolute', left: '7px', top: '20px', bottom: '-25px', width: '2px', background: '#eee', zIndex: 1 }}></div>}
                                        <div className="ms-4 p-3 w-100" style={{ background: '#fcfcfc', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>
                                                    {app.student?.name} <span style={{ fontWeight: '400', color: '#666' }}>applied for</span> {app.internship?.roleTitle}
                                                </h5>
                                                <span className="badge" style={{ backgroundColor: app.status === 'Selected' ? '#000' : '#eee', color: app.status === 'Selected' ? '#fff' : '#333', borderRadius: '6px' }}>{app.status || 'Applied'}</span>
                                            </div>
                                            <p className="mb-0" style={{ fontSize: '0.9rem', color: '#555' }}>Top tier posting from <strong>{app.internship?.companyName}</strong></p>
                                            <p className="mb-0 mt-2 text-end" style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold' }}>{app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'Recently'}</p>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="text-center py-5" style={{ color: 'rgba(0,0,0,0.5)' }}>No recent activities found.</div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Student Activity Modal */}
            <AnimatePresence>
                {showModal && selectedStudent && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="modal-overlay" 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div 
                            initial={{ y: 50, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            exit={{ y: 50, opacity: 0 }} 
                            className="universal-glass-card p-5" 
                            style={{ background: '#fff', width: '90%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                                <div>
                                    <h2 className="fw-bold mb-1" style={{ fontSize: '2.5rem',  letterSpacing: '-1px', color: '#000' }}>{selectedStudent.name}</h2>
                                    <p className="mb-0" style={{ color: 'rgba(0,0,0,0.6)' }}>Activity & Profile Monitoring ({selectedStudent.email})</p>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%', width: '40px', height: '40px', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                            </div>

                            {activityLoading ? (
                                <div className="text-center py-5"><span style={{ color: 'rgba(0,0,0,0.5)', fontSize: '1.1rem' }}>Loading student data...</span></div>
                            ) : (
                                <div className="row g-5">
                                    <div className="col-md-6">
                                        <h4 className="fw-bold mb-4" style={{ fontSize: '1.3rem', color: '#000' }}>Resume Insights</h4>
                                        {studentActivity ? (
                                            <div className="d-flex flex-column gap-4">
                                                <div>
                                                    <strong className="d-block mb-2" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(0,0,0,0.4)', fontWeight: '700' }}>Summary</strong>
                                                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#333' }}>{studentActivity.summary}</p>
                                                </div>
                                                <div>
                                                    <strong className="d-block mb-2" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(0,0,0,0.4)', fontWeight: '700' }}>Extracted Skills</strong>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {studentActivity.skills && studentActivity.skills.slice(0, 15).map((skill, idx) => (
                                                            <span key={idx} style={{ background: '#f8f8f8', border: '1px solid #eee', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500', color: '#111' }}>{skill}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <strong className="d-block mb-2" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(0,0,0,0.4)', fontWeight: '700' }}>Organizations</strong>
                                                    {studentActivity.organizations && studentActivity.organizations.length > 0 ? (
                                                        <ul className="ps-3 mb-0" style={{ fontSize: '0.95rem', color: '#333', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {studentActivity.organizations.map((org, idx) => (
                                                                <li key={idx}><strong>{org}</strong></li>
                                                            ))}
                                                        </ul>
                                                    ) : <span style={{ fontSize: '0.9rem', color: 'rgba(0,0,0,0.5)' }}>No organizations detected</span>}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-5 rounded text-center" style={{ background: '#fafafa', border: '1px dashed #e0e0e0' }}>
                                                <div style={{ fontSize: '2rem', marginBottom: '10px', color: '#ccc' }}>📄</div>
                                                <p className="mb-0 fw-medium" style={{ color: 'rgba(0,0,0,0.5)' }}>No resume parsed yet.</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <h4 className="fw-bold mb-4" style={{ fontSize: '1.3rem', color: '#000' }}>Application Timeline</h4>
                                        <div>
                                            {data.applications.filter(app => app.student?.id === selectedStudent.id).length > 0 ? (
                                                <div className="d-flex flex-column gap-3">
                                                    {data.applications.filter(app => app.student?.id === selectedStudent.id).map((app, idx) => (
                                                        <div key={idx} className="p-4" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eaeaea', borderLeft: '4px solid #000' }}>
                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                <h5 className="fw-bold mb-0" style={{ fontSize: '1.1rem', color: '#000' }}>{app.internship?.roleTitle}</h5>
                                                                <span className="badge mt-1" style={{ backgroundColor: app.status === 'Selected' ? '#000' : '#f0f0f0', color: app.status === 'Selected' ? '#fff' : '#000', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>{app.status || 'Applied'}</span>
                                                            </div>
                                                            <p className="mb-0 fw-medium" style={{ fontSize: '0.9rem', color: 'rgba(0,0,0,0.6)' }}>{app.internship?.companyName}</p>
                                                            <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                                                                <span style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.4)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Applied: {app.appliedDate || 'Recent'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-5 rounded text-center" style={{ background: '#fafafa', border: '1px dashed #e0e0e0' }}>
                                                    <div style={{ fontSize: '2rem', marginBottom: '10px', color: '#ccc' }}>📋</div>
                                                    <p className="mb-0 fw-medium" style={{ color: 'rgba(0,0,0,0.5)' }}>Student has not applied to any positions.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Spotlight Search Modal */}
            <AnimatePresence>
                {isSpotlightOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh' }}
                        onClick={() => setIsSpotlightOpen(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: -20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: -20 }} 
                            className="universal-glass-card p-0" 
                            style={{ background: '#fff', width: '90%', maxWidth: '650px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="d-flex align-items-center p-3 border-bottom" style={{ background: '#fcfcfc' }}>
                                <span style={{ fontSize: '1.5rem', marginRight: '15px', color: '#888' }}>🔍</span>
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Search students, companies, skills..." 
                                    value={spotlightQuery}
                                    onChange={(e) => setSpotlightQuery(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1.2rem', color: '#000' }}
                                />
                                <button onClick={() => setIsSpotlightOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '0.8rem', color: '#888', background: '#eee', padding: '4px 8px', borderRadius: '6px' }}>ESC</button>
                            </div>
                            <div className="p-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {spotlightQuery && spotlightResults().length === 0 ? (
                                    <div className="text-center py-4" style={{ color: '#888' }}>No results found for "{spotlightQuery}"</div>
                                ) : spotlightResults().map((res, i) => (
                                    <div key={i} className="p-3 mb-1 d-flex justify-content-between align-items-center" style={{ borderRadius: '10px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='#f5f5f5'} onMouseOut={e => e.currentTarget.style.background='transparent'} onClick={() => {
                                        setIsSpotlightOpen(false);
                                        if (res.type === 'Student') { setActiveTab('Students'); setSearchTerm(res.name); }
                                        if (res.type === 'Company') { setActiveTab('Companies'); }
                                    }}>
                                        <div>
                                            <span className="fw-bold d-block text-dark">{res.name}</span>
                                            <span style={{ fontSize: '0.85rem', color: '#666' }}>{res.email}</span>
                                        </div>
                                        <span className="badge" style={{ background: res.type === 'Student' ? '#eef2ff' : '#f0fdf4', color: res.type === 'Student' ? '#4f46e5' : '#166534' }}>{res.type}</span>
                                    </div>
                                ))}
                                {!spotlightQuery && (
                                    <div className="text-center py-4" style={{ color: '#aaa', fontSize: '0.9rem' }}>Type to search across the entire placement portal.</div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
        </div>
    );
};

export default AdminDashboard;
