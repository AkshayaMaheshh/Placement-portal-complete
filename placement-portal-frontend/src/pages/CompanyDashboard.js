import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '../components/Toast';
import { apiFetch } from '../services/api';

const CompanyDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInternships = async () => {
            try {
                const response = await apiFetch('/internships');
                if (response.ok) {
                    const data = await response.json();
                    // Assuming for now all internships belong to this company
                    setInternships(data);
                } else {
                    console.error("Failed to fetch internships");
                }
            } catch (error) {
                console.error("Error fetching internships:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInternships();
    }, []);

    const [selectedInternship, setSelectedInternship] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });

    // --- New/Edit Posting State ---
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [editInternshipId, setEditInternshipId] = useState(null);
    const [postLoading, setPostLoading] = useState(false);
    const [newPosting, setNewPosting] = useState({
        type: 'INTERNSHIP',
        roleTitle: '',
        companyName: '',
        location: '',
        stipend: '',
        requiredSkills: '',
        description: '',
        cgpaLimit: 7.0,
        eligibleDepts: []
    });
    const DEPARTMENTS = ["CSE", "AI&DS", "CSBS", "ECE", "CCE", "EE(VLSI)", "BIOTECH", "MECH"];

    const handleDeptToggle = (dept) => {
        setNewPosting(prev => ({
            ...prev,
            eligibleDepts: prev.eligibleDepts.includes(dept) 
                ? prev.eligibleDepts.filter(d => d !== dept) 
                : [...prev.eligibleDepts, dept]
        }));
    };

    const handleEditClick = (item) => {
        setEditInternshipId(item.id);
        const deptsArray = item.eligibleDepts ? item.eligibleDepts.split(',') : [];
        setNewPosting({
            type: item.type || 'INTERNSHIP',
            roleTitle: item.roleTitle || '',
            companyName: item.companyName || '',
            location: item.location || '',
            stipend: item.stipend || '',
            requiredSkills: item.requiredSkills || '',
            description: item.description || '',
            cgpaLimit: item.cgpaLimit || 7.0,
            eligibleDepts: deptsArray
        });
        setIsPostModalOpen(true);
    };

    const handleCreateNewClick = () => {
        setEditInternshipId(null);
        setNewPosting({ type: 'INTERNSHIP', roleTitle: '', companyName: '', location: '', stipend: '', requiredSkills: '', description: '', cgpaLimit: 7.0, eligibleDepts: [] });
        setIsPostModalOpen(true);
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        setPostLoading(true);
        try {
            const payload = { 
                ...newPosting, 
                stipend: parseFloat(newPosting.stipend) || 0.0,
                eligibleDepts: newPosting.eligibleDepts.join(',') 
            };
            
            const isEdit = !!editInternshipId;
            const endpoint = isEdit ? `/internships/${editInternshipId}` : '/internships';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await apiFetch(endpoint, {
                method,
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                setToast({ message: isEdit ? "Updated successfully!" : "Posted successfully!", type: 'success' });
                setIsPostModalOpen(false);
                setEditInternshipId(null);
                setNewPosting({ type: 'INTERNSHIP', roleTitle: '', companyName: '', location: '', stipend: '', requiredSkills: '', description: '', cgpaLimit: 7.0, eligibleDepts: [] });
                // Refresh list
                const refreshed = await apiFetch('/internships');
                if (refreshed.ok) setInternships(await refreshed.json());
            } else {
                setToast({ message: isEdit ? "Failed to update" : "Failed to post", type: 'error' });
            }
        } catch (err) {
            setToast({ message: "Network error", type: 'error' });
        } finally {
            setPostLoading(false);
        }
    };

    const handleDeleteClick = async (id) => {
        if (!window.confirm("Are you sure you want to delete this opportunity? This action cannot be undone.")) return;
        try {
            const res = await apiFetch(`/internships/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setToast({ message: "Deleted successfully!", type: 'success' });
                setInternships(prev => prev.filter(i => i.id !== id));
            } else {
                setToast({ message: "Failed to delete", type: 'error' });
            }
        } catch (err) {
            setToast({ message: "Network error", type: 'error' });
        }
    };
    // -------------------------

    const fetchApplicants = async (internship) => {
        setSelectedInternship(internship);
        setModalLoading(true);
        try {
            const response = await apiFetch(`/applications/internship/${internship.id}`);
            if (response.ok) {
                const data = await response.json();
                setApplicants(data);
            } else {
                setToast({ message: "Failed to fetch applicants", type: 'error' });
            }
        } catch (error) {
            console.error("Error fetching applicants:", error);
            setToast({ message: "Error connecting to server", type: 'error' });
        } finally {
            setModalLoading(false);
        }
    };

    const handleStatusChange = async (applicationId, newStatus) => {
        try {
            const response = await apiFetch(`/applications/${applicationId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setToast({ message: "Status updated successfully!", type: 'success' });
                // Refresh applicant list instead of mutating locally
                if (selectedInternship) {
                    fetchApplicants(selectedInternship);
                }
            } else {
                setToast({ message: "Failed to update status", type: 'error' });
            }
        } catch (error) {
            console.error("Error updating status:", error);
            setToast({ message: "Error updating status", type: 'error' });
        }
    };

    // Framer motion variants for stagger animations
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
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
                    <h1 className="fw-bold" style={{ fontSize: '2.5rem', letterSpacing: '-1px' }}>Company Dashboard</h1>
                    <p style={{ fontSize: '1.1rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                        Manage your posted internships and track applicants.
                    </p>
                </div>
                <div className="d-flex gap-3">
                    <button className="fw-bold" style={{ padding: '12px 24px', fontSize: '15px', background: 'transparent', border: '1px solid #000', color: '#000', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px' }}
                        onClick={handleLogout}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; }}
                    >
                        Logout
                    </button>
                    <button className="fw-bold" style={{ padding: '12px 24px', fontSize: '15px', background: '#000', border: '1px solid #000', color: '#fff', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px' }}
                        onClick={handleCreateNewClick}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                    >
                        + Post New Opportunity
                    </button>
                </div>
            </motion.div>

            {/* Internships Grid */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="mb-5">
                <h3 className="fw-bold mb-4" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>Active Internships</h3>

                {loading ? (
                    <div className="text-center mt-5"><span style={{ fontSize: '1.2rem', color: 'rgba(0,0,0,0.6)' }}>Loading...</span></div>
                ) : internships.filter(i => i.type !== 'JOB').length === 0 ? (
                    <div className="universal-glass-card p-5 text-center">
                        <p style={{ fontSize: '1.2rem', color: 'rgba(0,0,0,0.6)', margin: 0 }}>No internships posted yet.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {internships.filter(i => i.type !== 'JOB').map((internship, index) => (
                            <motion.div key={internship.id} className="col-12 col-md-6 col-lg-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5, boxShadow: "none" }} transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}>
                                <div className="universal-glass-card p-4 h-100 d-flex flex-column" style={{ background: '#fff' }}>

                                    <div className="mb-3">
                                        <h4 className="fw-bold mb-1" style={{ fontSize: '1.3rem', color: '#000' }}>{internship.roleTitle}</h4>
                                        <p className="mb-0" style={{ color: 'rgba(0,0,0,0.6)', fontSize: '1rem' }}>{internship.companyName}</p>
                                    </div>

                                    <div className="d-flex flex-column gap-2 mb-4" style={{ fontSize: '0.95rem', color: 'rgba(0,0,0,0.8)' }}>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fw-bold">Location:</span> <span>{internship.location || 'Remote'}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fw-bold">Stipend:</span> <span>{internship.stipend || 'Unpaid'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto d-flex flex-column gap-2">
                                        <div className="d-flex gap-2">
                                            <button
                                                className="flex-grow-1"
                                                style={{ padding: '10px', fontSize: '14px', background: 'transparent', border: '1px solid currentColor', color: '#000', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px', fontWeight: 'bold' }}
                                                onClick={() => handleEditClick(internship)}
                                                onMouseOver={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="flex-grow-1"
                                                style={{ padding: '10px', fontSize: '14px', background: 'transparent', border: '1px solid currentColor', color: '#d32f2f', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px', fontWeight: 'bold' }}
                                                onClick={() => handleDeleteClick(internship.id)}
                                                onMouseOver={(e) => { e.currentTarget.style.background = '#d32f2f'; e.currentTarget.style.color = '#fff'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d32f2f'; }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                        <button
                                            className="w-100"
                                            style={{ padding: '10px', fontSize: '14px', background: '#fff', border: '1px solid #000', color: 'black', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px' }}
                                            onClick={() => fetchApplicants(internship)}
                                            onMouseOver={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
                                        >
                                            View Applicants
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Jobs Grid */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="mb-5">
                <h3 className="fw-bold mb-4" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>Active Job Offers</h3>

                {loading ? (
                    <div className="text-center mt-5"><span style={{ fontSize: '1.2rem', color: 'rgba(0,0,0,0.6)' }}>Loading...</span></div>
                ) : internships.filter(i => i.type === 'JOB').length === 0 ? (
                    <div className="universal-glass-card p-5 text-center">
                        <p style={{ fontSize: '1.2rem', color: 'rgba(0,0,0,0.6)', margin: 0 }}>No job offers posted yet.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {internships.filter(i => i.type === 'JOB').map((job, index) => (
                            <motion.div key={job.id} className="col-12 col-md-6 col-lg-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5, boxShadow: "none" }} transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}>
                                <div className="universal-glass-card p-4 h-100 d-flex flex-column" style={{ background: '#fff' }}>
                                    <div className="mb-3">
                                        <h4 className="fw-bold mb-1" style={{ fontSize: '1.3rem', color: '#000' }}>{job.roleTitle}</h4>
                                        <p className="mb-0" style={{ color: 'rgba(0,0,0,0.6)', fontSize: '1rem' }}>{job.companyName}</p>
                                    </div>
                                    <div className="d-flex flex-column gap-2 mb-4" style={{ fontSize: '0.95rem', color: 'rgba(0,0,0,0.8)' }}>
                                        <div className="d-flex align-items-center gap-2"><span className="fw-bold">Location:</span> <span>{job.location || 'Remote'}</span></div>
                                        <div className="d-flex align-items-center gap-2"><span className="fw-bold">Salary:</span> <span>{job.stipend || 'Unpaid'}</span></div>
                                    </div>
                                    <div className="mt-auto d-flex flex-column gap-2">
                                        <div className="d-flex gap-2">
                                            <button
                                                className="flex-grow-1"
                                                style={{ padding: '10px', fontSize: '14px', background: 'transparent', border: '1px solid currentColor', color: '#000', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px', fontWeight: 'bold' }}
                                                onClick={() => handleEditClick(job)}
                                                onMouseOver={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="flex-grow-1"
                                                style={{ padding: '10px', fontSize: '14px', background: 'transparent', border: '1px solid currentColor', color: '#d32f2f', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px', fontWeight: 'bold' }}
                                                onClick={() => handleDeleteClick(job.id)}
                                                onMouseOver={(e) => { e.currentTarget.style.background = '#d32f2f'; e.currentTarget.style.color = '#fff'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d32f2f'; }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                        <button
                                            className="w-100"
                                            style={{ padding: '10px', fontSize: '14px', background: '#fff', border: '1px solid #000', color: 'black', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px' }}
                                            onClick={() => fetchApplicants(job)}
                                            onMouseOver={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
                                        >
                                            View Applicants
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>


            {/* Post Modal Overlay */}
            <AnimatePresence>
                {isPostModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                        onClick={() => setIsPostModalOpen(false)}
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
                                <h3 className="fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#000' }}>{editInternshipId ? "Edit Opportunity" : "Post New Opportunity"}</h3>
                                <button type="button" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.4)', color: 'black', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsPostModalOpen(false)}>✕</button>
                            </div>
                            
                            <form onSubmit={handlePostSubmit} className="d-flex flex-column gap-3 flex-grow-1 overflow-auto pe-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.2) transparent' }}>
                                <div className="d-flex gap-3">
                                    <div className="flex-grow-1">
                                        <label className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Type</label>
                                        <select className="form-select" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: '#000' }} value={newPosting.type} onChange={e => setNewPosting({...newPosting, type: e.target.value})}>
                                            <option value="INTERNSHIP">Internship</option>
                                            <option value="JOB">Job Offer</option>
                                        </select>
                                    </div>
                                    <div className="flex-grow-1">
                                        <label className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Role Title</label>
                                        <input type="text" className="form-control" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: '#000' }} required value={newPosting.roleTitle} onChange={e => setNewPosting({...newPosting, roleTitle: e.target.value})} placeholder="e.g. Frontend Engineer" />
                                    </div>
                                </div>

                                <div className="d-flex gap-3">
                                    <div className="flex-grow-1">
                                        <label className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Company Name</label>
                                        <input type="text" className="form-control" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: '#000' }} required value={newPosting.companyName} onChange={e => setNewPosting({...newPosting, companyName: e.target.value})} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <label className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Location</label>
                                        <input type="text" className="form-control" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: '#000' }} required value={newPosting.location} onChange={e => setNewPosting({...newPosting, location: e.target.value})} />
                                    </div>
                                </div>

                                <div>
                                    <label className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Eligible Departments</label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {DEPARTMENTS.map(dept => (
                                            <button type="button" key={dept} onClick={() => handleDeptToggle(dept)} className="badge" style={{ backgroundColor: newPosting.eligibleDepts.includes(dept) ? '#000' : 'rgba(255,255,255,0.4)', color: newPosting.eligibleDepts.includes(dept) ? '#fff' : '#000', border: '1px solid rgba(0,0,0,0.2)', padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', borderRadius: '8px' }}>
                                                {dept} {newPosting.eligibleDepts.includes(dept) && '✓'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="fw-bold mb-1 d-flex justify-content-between" style={{ fontSize: '0.9rem' }}>
                                        <span>CGPA Cutoff (Min limit)</span>
                                        <span>{newPosting.cgpaLimit.toFixed(1)} / 10.0</span>
                                    </label>
                                    <input type="range" className="form-range" min="0" max="10" step="0.1" value={newPosting.cgpaLimit} onChange={e => setNewPosting({...newPosting, cgpaLimit: parseFloat(e.target.value)})} />
                                </div>

                                <div className="d-flex gap-3">
                                    <div className="flex-grow-1">
                                        <label className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Stipend / Salary (in numbers)</label>
                                        <input type="number" className="form-control" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: '#000' }} required value={newPosting.stipend} onChange={e => setNewPosting({...newPosting, stipend: e.target.value})} placeholder="e.g. 50000" />
                                    </div>
                                </div>

                                <div>
                                    <label className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Required Skills (comma separated)</label>
                                    <input type="text" className="form-control" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: '#000' }} value={newPosting.requiredSkills} onChange={e => setNewPosting({...newPosting, requiredSkills: e.target.value})} placeholder="React, Node, SQL..." />
                                </div>

                                <div>
                                    <label className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Decription</label>
                                    <textarea className="form-control" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: '#000', resize: 'none' }} rows="2" required value={newPosting.description} onChange={e => setNewPosting({...newPosting, description: e.target.value})}></textarea>
                                </div>

                                <button type="submit" disabled={postLoading} className="w-100 mt-2 fw-bold" style={{ padding: '12px', fontSize: '15px', background: postLoading ? '#888' : '#000', border: '1px solid #000', color: '#fff', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px' }}>
                                    {postLoading ? (editInternshipId ? 'Updating...' : 'Posting...') : (editInternshipId ? 'Save Changes' : 'Publish to Students')}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Applicants Modal Overlay */}
            <AnimatePresence>
                {selectedInternship && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(12px)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}
                        onClick={() => setSelectedInternship(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="universal-glass-card p-4 d-flex flex-column"
                            style={{
                                width: '100%',
                                maxWidth: '900px',
                                maxHeight: '80vh'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h3 className="fw-bold mb-1" style={{ fontSize: '1.5rem', color: '#000' }}>Applicants</h3>
                                    <p className="mb-0" style={{ color: 'rgba(0,0,0,0.6)' }}>{selectedInternship.roleTitle} at {selectedInternship.companyName}</p>
                                </div>
                                <button
                                    className="btn btn-sm"
                                    style={{ background: 'rgba(255,255,255,0.4)', color: 'black', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => setSelectedInternship(null)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex-grow-1 overflow-auto pe-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.2) transparent' }}>
                                {modalLoading ? (
                                    <div className="text-center py-5">
                                        <span style={{ color: 'rgba(0,0,0,0.6)' }}>Loading applicants...</span>
                                    </div>
                                ) : applicants.length === 0 ? (
                                    <div className="text-center py-5" style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
                                        <p style={{ color: 'rgba(0,0,0,0.6)', margin: 0, fontSize: '1.1rem' }}>No applicants yet for this position.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-borderless mb-0" style={{ color: 'black' }}>
                                            <thead style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                                <tr>
                                                    <th className="fw-bold py-3 px-3" style={{ color: 'rgba(0,0,0,0.6)', background: 'transparent' }}>Student Name</th>
                                                    <th className="fw-bold py-3 px-3" style={{ color: 'rgba(0,0,0,0.6)', background: 'transparent' }}>Email</th>
                                                    <th className="fw-bold py-3 px-3" style={{ color: 'rgba(0,0,0,0.6)', background: 'transparent' }}>Applied Date</th>
                                                    <th className="fw-bold py-3 px-3" style={{ color: 'rgba(0,0,0,0.6)', background: 'transparent' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {applicants.map((app, idx) => (
                                                    <tr key={app.id} style={{ borderBottom: idx !== applicants.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                                        <td className="py-3 px-3 align-middle" style={{ background: 'transparent' }}>{app.student?.name || 'Unknown'}</td>
                                                        <td className="py-3 px-3 align-middle" style={{ background: 'transparent', color: 'rgba(0,0,0,0.8)' }}>{app.student?.email || 'Unknown'}</td>
                                                        <td className="py-3 px-3 align-middle" style={{ background: 'transparent', color: 'rgba(0,0,0,0.5)' }}>{app.appliedDate}</td>
                                                        <td className="py-3 px-3 align-middle" style={{ background: 'transparent' }}>
                                                            <select
                                                                className="form-select form-select-sm"
                                                                value={app.status || 'Applied'}
                                                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                                                style={{
                                                                    backgroundColor: 'rgba(255,255,255,0.5)',
                                                                    color: 'black',
                                                                    border: '1px solid rgba(0,0,0,0.2)',
                                                                    boxShadow: 'none',
                                                                    cursor: 'pointer',
                                                                    width: '140px'
                                                                }}
                                                            >
                                                                <option value="Applied">Applied</option>
                                                                <option value="Shortlisted">Shortlisted</option>
                                                                <option value="Interview">Interview</option>
                                                                <option value="Selected">Selected</option>
                                                                <option value="Rejected">Rejected</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
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

export default CompanyDashboard;
