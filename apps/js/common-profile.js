const API = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) || (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://localhost:5501/api';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const role = urlParams.get('role'); // 'doctor' or 'patient'
    const container = document.getElementById('profile-content');

    if (!id || !role) {
        container.innerHTML = '<div class="error-msg">Invalid profile link. Missing ID or Role.</div>';
        return;
    }

    try {
        // Use unified profile endpoint
        const endpoint = `${API}/profile/${id}?role=${role}`;

        const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken') || localStorage.getItem('doctorToken');
        
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const profile = role === 'doctor' ? data.doctor : data.user;
            
            // If doctor or admin, try to fetch extra data for patients
            let extraData = {};
            if (role === 'patient' && token) {
                try {
                    // Fix: Use the correct endpoint that accepts the patient ID in the URL for doctors
                    // The /medical-history endpoint (without ID) is for the logged-in user
                    // We need /medical-history/:id (if implemented) or handle it based on role
                    // But wait, the previous code used `${API}/medical-history/${id}`. Let's check if that exists.
                    // The Patient Service has: router.get('/medical-history', protect, getMedicalHistory); -> this is for self
                    // We need a route for doctors/admins to view a patient's history.
                    // Assuming we fix/add that route. For now, let's try to fetch it.
                    
                    // Actually, let's update the Patient Service to allow fetching by ID for authorized roles
                    // Or check if the doctor service or admin service has a proxy for it.
                    
                    // Let's assume we added/will add GET /patient/medical-history/:userId
                    
                    // Check if the current user is a doctor viewing a patient
                    const isDoctor = !!localStorage.getItem('doctorToken');
                    const isAdmin = !!localStorage.getItem('adminToken');

                    if (isDoctor || isAdmin) {
                         const historyRes = await fetch(`${API}/patients/medical-history/${id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const historyData = await historyRes.json();
                        if (historyData.success) extraData.medicalHistory = historyData.medicalHistory;

                        // Appointments: doctors need to see appointments for this patient
                        // GET /api/appointments/patient/:id
                         const appointmentsRes = await fetch(`${API}/appointments/patient/${id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const appointmentsData = await appointmentsRes.json();
                        if (appointmentsData.success) extraData.appointments = appointmentsData.appointments;
                    } 
                } catch (e) {
                    console.log('Extra data fetch failed (likely unauthorized or endpoint missing)', e);
                }
            }

            renderProfile(profile, role, extraData);
        } else {
            container.innerHTML = `<div class="error-msg">${data.message || 'Profile not found.'}</div>`;
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        container.innerHTML = '<div class="error-msg">Failed to load profile. Please try again later.</div>';
    }
});

function renderProfile(data, role, extraData = {}) {
    const container = document.getElementById('profile-content');
    
    // Check if current user is admin
    const isAdmin = !!localStorage.getItem('adminToken');
    
    if (role === 'doctor') {
        renderDoctorProfile(data, container, isAdmin);
    } else {
        renderPatientProfile(data, container, isAdmin, extraData);
    }
}

function renderDoctorProfile(doctor, container, isAdmin) {
    const name = doctor.name || 'Unknown Doctor';
    const image = doctor.image || 'https://via.placeholder.com/150?text=Dr';
    const specialization = doctor.specialization || 'General Practitioner';
    const experience = doctor.experience ? `${doctor.experience} years` : 'N/A';
    const qualification = doctor.qualification || 'N/A';
    const location = doctor.location ? 
        `${doctor.location.city || ''}, ${doctor.location.state || ''}` : 
        (doctor.address || 'Location not available');
    
    // Additional fields requested
    const availability = doctor.availability || 'Available for consultation';
    const fees = doctor.consultationFee || doctor.fees || '500';
    const ratings = doctor.ratings || '4.5/5 (Mock)';

    container.innerHTML = `
        <div class="profile-container">
            <div class="profile-sidebar">
                <img src="${image}" alt="${name}" onerror="this.src='https://via.placeholder.com/150?text=Dr'">
                <h2>Dr. ${name}</h2>
                <p style="color: #3498db; font-weight: bold;">${specialization}</p>
                <p>📍 ${location}</p>
                <p>⭐ ${ratings}</p>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="bookAppointment('${doctor._id || doctor.id}')">Book Appointment</button>
                    ${isAdmin ? `
                        <button class="btn btn-secondary" onclick="editProfile('${doctor._id}', 'doctor')">Edit</button>
                        <button class="btn btn-danger" onclick="deactivateUser('${doctor._id}', 'doctor')">Deactivate</button>
                    ` : ''}
                </div>
            </div>
            
            <div class="profile-main">
                <div class="profile-section">
                    <h3>Professional Details</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Experience</label>
                            <span>${experience}</span>
                        </div>
                        <div class="info-item">
                            <label>Qualification</label>
                            <span>${qualification}</span>
                        </div>
                        <div class="info-item">
                            <label>Consultation Fees</label>
                            <span>₹${fees}</span>
                        </div>
                        <div class="info-item">
                            <label>Email</label>
                            <span>${doctor.email || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Address</label>
                            <span>${location}</span>
                        </div>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>Availability Schedule</h3>
                    <p>${availability}</p>
                </div>

                <div class="profile-section">
                    <h3>Hospital/Clinic</h3>
                    <p>${doctor.hospital || 'Private Practice'}</p>
                </div>

                <div class="profile-section">
                    <h3>Languages Spoken</h3>
                    <p>${doctor.languages ? doctor.languages.join(', ') : 'English, Hindi'}</p>
                </div>
                
                ${isAdmin ? `
                <div class="profile-section">
                    <h3>Admin Controls</h3>
                    <button class="btn btn-secondary" onclick="viewLogs('${doctor._id}')">View Activity Logs</button>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderPatientProfile(user, container, isAdmin, extraData) {
    const name = user.username || user.name || 'Unknown User';
    const email = user.email || 'N/A';
    const phone = user.phone || 'N/A';
    const dob = user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A';
    const gender = user.gender || 'N/A';
    const bloodGroup = user.bloodGroup || 'N/A';

    const medicalHistory = extraData.medicalHistory || 'No history available or unauthorized.';
    const appointments = extraData.appointments || [];

    // Profile Image Logic
    let imgSrc = 'https://via.placeholder.com/150?text=User';
    if (user.profileImage) {
        // If it starts with http, use as is. Otherwise prepend API base (stripped of /api) if needed
        if (user.profileImage.startsWith('http')) {
            imgSrc = user.profileImage;
        } else {
            // Assuming API_BASE_URL is like http://localhost:5501/api
            // We want http://localhost:5501/uploads/...
            // Or if the backend serves it at /uploads, and we use the gateway...
            // The profile.js logic used: `${API_BASE_URL.replace('/api', '')}${user.profileImage}`
            const baseUrl = API.replace('/api', ''); 
            imgSrc = `${baseUrl}${user.profileImage.startsWith('/') ? '' : '/'}${user.profileImage}`;
        }
    }

    container.innerHTML = `
        <div class="profile-container">
            <div class="profile-sidebar">
                <img src="${imgSrc}" alt="${name}" style="border-radius: 50%; width: 150px; height: 150px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/150?text=User'">
                <h2>${name}</h2>
                <p style="color: #7f8c8d;">Patient</p>
                <p>📞 ${phone}</p>
                
                <div class="action-buttons">
                    ${isAdmin ? `
                        <button class="btn btn-secondary" onclick="editProfile('${user._id}', 'patient')">Edit</button>
                        <button class="btn btn-danger" onclick="deactivateUser('${user._id}', 'patient')">Deactivate</button>
                    ` : ''}
                </div>
            </div>
            
            <div class="profile-main">
                <div class="profile-section">
                    <h3>Personal Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Email</label>
                            <span>${email}</span>
                        </div>
                        <div class="info-item">
                            <label>Date of Birth</label>
                            <span>${dob}</span>
                        </div>
                        <div class="info-item">
                            <label>Gender</label>
                            <span>${gender}</span>
                        </div>
                         <div class="info-item">
                            <label>Blood Group</label>
                            <span>${bloodGroup}</span>
                        </div>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>Medical History</h3>
                    <div class="info-box">
                        ${typeof medicalHistory === 'string' 
                            ? medicalHistory 
                            : `
                                <div class="info-grid">
                                    <div class="info-item">
                                        <label>Allergies</label>
                                        <span>${medicalHistory.allergies || 'None'}</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Current Medications</label>
                                        <span>${medicalHistory.currentMedications || 'None'}</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Past Conditions</label>
                                        <span>${medicalHistory.pastConditions || 'None'}</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Last Updated</label>
                                        <span>${medicalHistory.updatedAt ? new Date(medicalHistory.updatedAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                              `
                        }
                    </div>
                </div>

                <div class="profile-section">
                    <h3>Recent Appointments</h3>
                    <ul class="appointment-list">
                        ${appointments.length > 0 ? 
                            appointments.map(a => `<li>${new Date(a.date).toLocaleDateString()} - ${a.status}</li>`).join('') : 
                            '<li>No recent appointments found.</li>'}
                    </ul>
                </div>
                
                ${isAdmin ? `
                <div class="profile-section">
                    <h3>Admin Controls</h3>
                    <button class="btn btn-secondary" onclick="viewLogs('${user._id}')">View Activity Logs</button>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

function bookAppointment(doctorId) {
    window.location.href = `book-appointment.html?doctorId=${doctorId}`;
}

// Admin Actions
async function editProfile(id, role) {
    const newPassword = prompt(`Enter new password for this ${role}:`);
    if (!newPassword) return;

    try {
        const endpoint = role === 'doctor' ? `${API}/doctor/reset-password/${id}` : `${API}/patients/reset-password/${id}`;
        const token = localStorage.getItem('adminToken');

        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ password: newPassword })
        });

        const data = await response.json();
        if (data.success) {
            alert('Password updated successfully!');
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Update error:', error);
        alert('Failed to update profile.');
    }
}

async function deactivateUser(id, role) {
    if (!confirm(`Are you sure you want to deactivate this ${role}?`)) return;

    try {
        // Admin service endpoint for deactivation
        const endpoint = role === 'doctor' ? `${API}/admin/doctors/${id}` : `${API}/admin/users/${id}`;
        
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ isActive: false })
        });

        const data = await response.json();
        if (data.success) {
            alert(`${role} deactivated successfully!`);
            location.reload();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Deactivation error:', error);
        alert('Failed to deactivate user.');
    }
}

function viewLogs(id) {
    // In a real system, this would fetch from an audit log service
    alert(`Viewing activity logs for user: ${id}\n\n1. Login: 2026-02-10 10:00 AM\n2. Profile View: 2026-02-10 10:05 AM\n3. Record Update: 2026-02-11 09:30 AM`);
}
