// dr-nearby/js/doctor-portal.js


let API_BASE;
function getApiBase() {
  if (API_BASE) return API_BASE;
  API_BASE = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) || 
             (typeof window !== 'undefined' && window.API_BASE_URL) || 
             'http://localhost:5501/api';
  return API_BASE;
}

// ─── LOGIN ────────────────────────────────────────────────
async function doctorLogin(email, password) {
    try {
        const apiBase = getApiBase();
        console.log('Logging in doctor with API:', `${apiBase}/doctor/login`);
        
        const response = await fetch(`${apiBase}/doctor/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        console.log('Login response status:', response.status);
        
        let data;
        try {
            const text = await response.text();
            console.log('Login response text:', text);
            if (!text) {
                return { success: false, message: 'Empty response from server. Please check if Doctor Service is running.' };
            }
            data = JSON.parse(text);
            console.log('Login response data:', { ...data, token: data.token ? '***' : undefined });
        } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            return { success: false, message: `Server error. Status: ${response.status}. Please check if services are running.` };
        }
        
        if (response.ok && data.success) {
            localStorage.setItem('doctorToken', data.token);
            localStorage.setItem('doctorEmail', email);
            if (data.doctor) {
                localStorage.setItem('doctorData', JSON.stringify(data.doctor));
            }
            return { success: true, data, message: 'Login successful!' };
        } else {
            const errorMsg = data.message || `Login failed. Server returned status ${response.status}.`;
            console.error('Login failed:', errorMsg);
            return { success: false, message: errorMsg };
        }
    } catch (error) {
        console.error('Doctor login error:', error);
        let errorMsg = 'An error occurred during login.';
        
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            errorMsg = 'Cannot connect to server. Please ensure:\n1. API Gateway is running (port 5501)\n2. Doctor Service is running (port 5503)\n3. MongoDB is running';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        return { success: false, message: errorMsg };
    }
}

// ─── REGISTER ─────────────────────────────────────────────
async function registerDoctor(doctorData) {
    try {
        const apiBase = getApiBase();
        console.log('Registering doctor with API:', `${apiBase}/doctor/register`);
        console.log('Doctor data:', { ...doctorData, password: '***' });
        
        const response = await fetch(`${apiBase}/doctor/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doctorData)
        });
        
        console.log('Registration response status:', response.status);
        console.log('Registration response headers:', response.headers);
        
        let data;
        try {
            const text = await response.text();
            console.log('Registration response text:', text);
            if (!text) {
                const errorMsg = 'Empty response from server. Please check if Doctor Service is running.';
                console.error(errorMsg);
                return { success: false, message: errorMsg };
            }
            data = JSON.parse(text);
            console.log('Registration response data:', data);
        } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            const errorMsg = `Server error. Status: ${response.status}. Response might not be JSON. Please check if services are running.`;
            return { success: false, message: errorMsg };
        }
        
        if (response.ok && data.success) {
            return { success: true, message: data.message || 'Registration successful! Please login.' };
        } else {
            const errorMsg = data.message || `Registration failed. Server returned status ${response.status}.`;
            console.error('Registration failed:', errorMsg);
            return { success: false, message: errorMsg };
        }
    } catch (error) {
        console.error('Doctor registration error:', error);
        let errorMsg = 'An error occurred during registration.';
        
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            errorMsg = 'Cannot connect to server. Please ensure:\n1. API Gateway is running (port 5501)\n2. Doctor Service is running (port 5503)\n3. MongoDB is running';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        return { success: false, message: errorMsg };
    }
}

// ─── LOGOUT ───────────────────────────────────────────────
function doctorLogout() {
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('doctorEmail');
    localStorage.removeItem('doctorData');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    window.location.href = '/apps/logout.html';
}

// ─── TOKEN VERIFICATION ───────────────────────────────────
async function verifyDoctorToken() {
    const token = localStorage.getItem('doctorToken');
    if (!token) return false;
    try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/doctor/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.doctor) {
                localStorage.setItem('doctorData', JSON.stringify(data.doctor));
            }
        }
        return response.ok;
    } catch (error) {
        console.error('Token verification failed:', error);
        return false;
    }
}

// ─── PROTECT DOCTOR PAGES ─────────────────────────────────
async function protectDoctorPage() {
    const hasToken = !!localStorage.getItem('doctorToken');
    if (!hasToken) {
        alert('Please login as a doctor to access this page.');
        window.location.href = 'doctor-login.html';
        return false;
    }
    const isValid = await verifyDoctorToken();
    if (!isValid) {
        alert('Session expired or invalid. Please login again.');
        doctorLogout();
        return false;
    }
    return true;
}

// ─── MESSAGE HELPER ───────────────────────────────────────
function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = type;
        messageDiv.style.display = 'block';
        
        messageDiv.style.color = type === 'success' ? 'green' : 'red';
        messageDiv.style.backgroundColor = type === 'success' 
            ? '#d4edda' 
            : '#f8d7da';
    }
}

// ─── INIT LOGIN FORM ──────────────────────────────────────
function initDoctorLoginForm() {
    const form = document.getElementById('doctorLoginForm');
    if (!form) {
        console.warn('Doctor login form not found');
        return;
    }
    
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        if (!email || !password) {
            showMessage('Please fill all fields.', 'error');
            return;
        }
        
        
        const msgDiv = document.getElementById('message');
        if (msgDiv) {
            msgDiv.textContent = 'Logging in...';
            msgDiv.style.color = 'blue';
            msgDiv.style.display = 'block';
        }
        
        try {
            const res = await doctorLogin(email, password);
            if (res && res.success) {
                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'doctor-Dashboard.html';
                }, 500);
            } else {
                showMessage(res?.message || 'Login failed. Please check your credentials.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('An error occurred during login. Please try again.', 'error');
        }
    });
}

// ─── INIT REGISTER FORM ───────────────────────────────────
function initDoctorRegisterForm() {
    const form = document.getElementById('doctorRegForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        
    });
}

// ─── INITIALIZE ON LOAD ───────────────────────────────────

function initializeForms() {
    try {
        initDoctorLoginForm();
        initDoctorRegisterForm();
    } catch (error) {
        console.error('Error initializing doctor forms:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeForms);
} else {
    // DOM already loaded
    initializeForms();
}


window.addEventListener('load', () => {
    
    const loginForm = document.getElementById('doctorLoginForm');
    if (loginForm && !loginForm.hasAttribute('data-initialized')) {
        loginForm.setAttribute('data-initialized', 'true');
        initDoctorLoginForm();
    }
});

async function setConsultationLink(consultationId, meetLink) {
    const token = localStorage.getItem('doctorToken');
    if (!token) return { success: false, message: 'Not logged in' };

    try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/consultations/${consultationId}/link`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ meetLink })
        });

        return await response.json();
    } catch (error) {
        console.error('Error setting meeting link:', error);
        return { success: false, message: 'Network error' };
    }
}

// ─── EXPOSE TO GLOBAL SCOPE ───────────────────────────────
window.doctorLogout = doctorLogout;
window.protectDoctorPage = protectDoctorPage;
window.registerDoctor = registerDoctor;
window.showMessage = showMessage;
window.setConsultationLink = setConsultationLink;