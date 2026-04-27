const BASE_URL = "http://localhost:8081/api";

export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    const isFormData = options.body instanceof FormData;
    const headers = { ...options.headers };
    
    if (!isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const fetchOptions = {
        ...options,
        headers,
    };

    // If token exists, add it to Authorization header
    if (token) {
        fetchOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    // Construct full URL if just a path is passed
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, fetchOptions);

        if (response.status === 401 || response.status === 403) {
            // Unauthorized or Forbidden: clear storage and redirect
            localStorage.clear();
            window.location.href = '/login';
            throw new Error(`Authentication failed: ${response.status}`);
        }

        return response;
    } catch (error) {
        throw error;
    }
};

export const registerUser = async (userData) => {
    try {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const data = await response.text();
        return data;
    } catch (error) {
        console.error('Error in registerUser:', error);
        throw error;
    }
};

export const loginUser = async (loginData) => {
    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in loginUser:', error);
        throw error;
    }
};

export const loginWithGoogle = async (token) => {
    try {
        const response = await fetch(`${BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in loginWithGoogle:', error);
        throw error;
    }
};

export const fetchStudentResumeData = async (studentId) => {
    try {
        const response = await apiFetch(`/resume/student/${studentId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch resume data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching resume data:', error);
        throw error;
    }
};

export const downloadResumePdf = async (studentId) => {
    try {
        const response = await apiFetch(`/resume/download/${studentId}`);
        if (!response.ok) {
            throw new Error('Failed to download resume pdf');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Optional timeout to revoke object url to save memory
        setTimeout(() => window.URL.revokeObjectURL(url), 1000 * 60);
    } catch (error) {
        console.error('Error downloading resume pdf:', error);
        throw error;
    }
};
export const updateStudent = async (id, studentData) => {
    try {
        const response = await apiFetch(`/admin/student/${id}`, {
            method: 'PUT',
            body: JSON.stringify(studentData),
        });
        if (!response.ok) {
            throw new Error('Failed to update student info');
        }
        return await response.text();
    } catch (error) {
        console.error('Error updating student info:', error);
        throw error;
    }
};

export const updateInternship = async (id, internshipData) => {
    try {
        const response = await apiFetch(`/admin/internship/${id}`, {
            method: 'PUT',
            body: JSON.stringify(internshipData),
        });
        if (!response.ok) {
            throw new Error('Failed to update internship info');
        }
        return await response.text();
    } catch (error) {
        console.error('Error updating internship info:', error);
        throw error;
    }
};
