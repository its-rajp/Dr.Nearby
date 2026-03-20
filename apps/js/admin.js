// apps/js/admin.js
// Admin dashboard & login functionality

const API = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) || (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://localhost:5501/api';

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/apps/logout.html';
}

let totalMedicineRevenue = 0;
let totalLabRevenue = 0;
let totalConsultationRevenue = 0;

function renderRevenue() {
    const total = totalMedicineRevenue + totalLabRevenue + totalConsultationRevenue;
    const firstSection = document.querySelector('.dashboard-section');
    if (!firstSection) return;

    let display = document.getElementById('revenueDisplay');
    if (!display) {
        display = document.createElement('div');
        display.id = 'revenueDisplay';
        display.style = 'background: #d1ecf1; color: #0c5460; padding: 15px; margin-bottom: 20px; border-radius: 8px; font-size: 1.2rem; font-weight: bold; border: 1px solid #bee5eb;';
        firstSection.parentNode.insertBefore(display, firstSection);
    }
    display.innerHTML = `
        Total Revenue: ₹${total.toLocaleString()} 
        <div style="font-size:0.9rem; font-weight:normal; margin-top:5px;">
            Medicine: ₹${totalMedicineRevenue.toLocaleString()} | 
            Lab: ₹${totalLabRevenue.toLocaleString()} | 
            Consultations: ₹${totalConsultationRevenue.toLocaleString()}
        </div>`;
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const message = document.getElementById('message');
    
    if (message) message.textContent = 'Logging in...';

    try {
        const response = await fetch(`${API}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.admin));
            window.location.href = 'admin_dashboard.html';
        } else {
            if (message) {
                message.textContent = data.message || 'Login failed';
                message.style.color = 'red';
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        if (message) {
            message.textContent = 'Server error. Please ensure services are running.';
            message.style.color = 'red';
        }
    }
}

// Data loading functions
let usersData = [];
let doctorsData = [];

async function loadUsers() {
  try {
    const response = await fetch(`${API}/admin/users`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.users) {
        usersData = data.users.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        if (data.users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7">No users found</td></tr>';
        } else {
          tbody.innerHTML = data.users.map((user, index) => {
            const lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null;
            // specific user example requested "Not logged in"
            const status = lastLoginDate && (new Date() - lastLoginDate < 30 * 60 * 1000) 
                ? '<span style="color:green; font-weight:bold">Online</span>' 
                : '<span style="color:gray">Not logged in</span>';
            const history = lastLoginDate ? lastLoginDate.toLocaleString() : '';
            
            let imgSrc = 'https://via.placeholder.com/40?text=U';
            if (user.profileImage) {
                 if (user.profileImage.startsWith('http')) {
                     imgSrc = user.profileImage;
                 } else {
                     const baseUrl = API.replace('/api', '');
                     imgSrc = `${baseUrl}${user.profileImage.startsWith('/') ? '' : '/'}${user.profileImage}`;
                 }
            }

            return `
            <tr>
              <td>${index + 1}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${imgSrc}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/40?text=U'">
                    ${user.username || user.name || 'N/A'}
                </div>
              </td>
              <td>${user.email || 'N/A'}</td>
              <td>
                <span style="font-family: monospace; margin-right: 5px;">${user.password || 'N/A'}</span>
                <button onclick="promptResetUserPassword('${user._id || user.id}')" style="padding:2px 5px; font-size:0.8rem;">Reset</button>
              </td>
              <td>${status}</td>
              <td>${history}</td>
              <td>
                <button onclick="viewUserDetails(${index})">View Details</button>
                <button onclick="editUser('${user._id || user.id}')">Edit</button>
                <button onclick="deleteUser('${user._id || user.id}')">Delete</button>
              </td>
            </tr>
          `}).join('');
        }
      } else {
        tbody.innerHTML = '<tr><td colspan="7">Error loading users</td></tr>';
      }
    } else {
      tbody.innerHTML = '<tr><td colspan="7">Error loading users</td></tr>';
    }
  } catch (error) {
    console.error('Error loading users:', error);
    const tbody = document.getElementById('usersTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7">Error loading users</td></tr>';
  }
}

async function loadDoctors() {
  try {
    const response = await fetch(`${API}/admin/doctors`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const tbody = document.getElementById('doctorsTableBody');
    if (!tbody) return;

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.doctors) {
        doctorsData = data.doctors.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        if (data.doctors.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7">No doctors found</td></tr>';
        } else {
          tbody.innerHTML = data.doctors.map((doc, index) => {
            const lastLoginDate = doc.lastLogin ? new Date(doc.lastLogin) : null;
            const status = lastLoginDate && (new Date() - lastLoginDate < 30 * 60 * 1000) 
                ? '<span style="color:green; font-weight:bold">Online</span>' 
                : '<span style="color:gray">Not logged in</span>';
            const history = lastLoginDate ? lastLoginDate.toLocaleString() : '';

            let imgSrc = 'https://via.placeholder.com/40?text=Dr';
            if (doc.profileImage) {
                 if (doc.profileImage.startsWith('http')) {
                     imgSrc = doc.profileImage;
                 } else {
                     const baseUrl = API.replace('/api', '');
                     imgSrc = `${baseUrl}${doc.profileImage.startsWith('/') ? '' : '/'}${doc.profileImage}`;
                 }
            }

            return `
            <tr>
              <td>${index + 1}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${imgSrc}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/40?text=Dr'">
                    ${doc.name || 'N/A'}
                </div>
              </td>
              <td>${doc.email || 'N/A'}</td>
              <td>
                <div style="max-width: 150px; overflow-wrap: break-word; font-size: 0.8rem;">${doc.password || 'N/A'}</div>
                <button onclick="promptResetDoctorPassword('${doc._id || doc.id}')" style="padding:2px 5px; font-size:0.8rem; margin-top:5px;">Reset</button>
              </td>
              <td>${status}</td>
              <td>${history}</td>
              <td>
                <button onclick="viewDoctorDetails(${index})">View Details</button>
                <button onclick="editDoctor('${doc._id || doc.id}')">Edit</button>
                <button onclick="deleteDoctor('${doc._id || doc.id}')">Delete</button>
              </td>
            </tr>
          `}).join('');
        }
      }
    }
  } catch (error) {
    console.error('Error loading doctors:', error);
  }
}

async function loadAppointments() {
    try {
        const response = await fetch(`${API}/appointments`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const tbody = document.getElementById('appointmentsTableBody');
        const secondOpinionBody = document.getElementById('secondOpinionTableBody');
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.appointments) {
                // Calculate revenue from settled/paid appointments
                totalConsultationRevenue = data.appointments.reduce((sum, appt) => {
                    if (appt.paymentStatus === 'settled' || appt.paymentStatus === 'paid') {
                        return sum + (appt.consultationFee || 0);
                    }
                    return sum;
                }, 0);
                renderRevenue();

                // 1. Populate All Appointments Table
                if (tbody) {
                    if (data.appointments.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="7">No appointments found</td></tr>';
                    } else {
                        tbody.innerHTML = data.appointments.map((appt, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${appt.patientId?.username || 'Unknown'}</td>
                                <td>${appt.doctorId?.name || 'Unknown'}</td>
                                <td>${new Date(appt.date).toLocaleDateString()}</td>
                                <td>${appt.time}</td>
                                <td>${appt.status}</td>
                                <td>
                                    <button onclick="viewAppointment('${appt._id}')">View</button>
                                </td>
                            </tr>
                        `).join('');
                    }
                }

                // 2. Populate Second Opinion / Link Assignment Table
                // Filter for 'approved' appointments which need scheduling/link
                if (secondOpinionBody) {
                    const approvedAppts = data.appointments.filter(appt => appt.status === 'approved');
                    
                    if (approvedAppts.length === 0) {
                        secondOpinionBody.innerHTML = '<tr><td colspan="6">No appointments pending link assignment</td></tr>';
                    } else {
                        secondOpinionBody.innerHTML = approvedAppts.map((appt, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${appt.patientId?.username || 'Unknown'}</td>
                                <td>${appt.doctorId?.name || 'Unknown'}</td>
                                <td>${new Date(appt.date).toLocaleDateString()} ${appt.time}</td>
                                <td>${appt.status}</td>
                                <td>
                                    <button class="add-btn" style="padding: 5px 10px; font-size: 0.8rem;" 
                                            onclick="openLinkModal('${appt._id}')">Assign Link</button>
                                </td>
                            </tr>
                        `).join('');
                    }
                }
            } else {
                if(tbody) tbody.innerHTML = '<tr><td colspan="7">Error loading appointments</td></tr>';
            }
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

async function loadConsultations() {
    try {
        const response = await fetch(`${API}/consultations`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const tbody = document.getElementById('consultationsTableBody');
        if (!tbody) return;

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.consultations) {
                // Filter out completed and cancelled consultations to show only active ones
                const activeConsultations = data.consultations.filter(c => c.status !== 'completed' && c.status !== 'cancelled');
                
                if (activeConsultations.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6">No active consultations</td></tr>';
                } else {
                    tbody.innerHTML = activeConsultations.map((cons, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${cons.userId?.username || 'Unknown'}</td>
                            <td>${cons.doctorId?.name || 'Unknown'}</td>
                            <td>${cons.status}</td>
                            <td>${cons.meetLink ? `<a href="${cons.meetLink}" target="_blank">Join</a>` : 'Pending'}</td>
                            <td>
                                <button onclick="viewConsultation('${cons._id}')">Details</button>
                            </td>
                        </tr>
                    `).join('');
                }
            }
        }
    } catch (error) {
        console.error('Error loading consultations:', error);
    }
}

async function loadMedicineOrders() {
    try {
        const response = await fetch(`${API}/patients/orders/admin/all`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const tbody = document.getElementById('medicineOrdersTableBody');
        if (!tbody) return;

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.orders) {
                totalMedicineRevenue = data.orders.reduce((sum, order) => sum + (order.amount || 0), 0);
                renderRevenue();
                
                if (data.orders.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="10">No orders found</td></tr>';
                } else {
                    tbody.innerHTML = data.orders.map(order => `
                        <tr>
                            <td>${order._id}</td>
                            <td>${order.userId?.email || 'N/A'}</td>
                            <td>${order.medicines?.map(m => `${m.name} (x${m.quantity})`).join(', ') || 'N/A'}</td>
                            <td>₹${order.amount || 0}</td>
                            <td>${order.paymentMethod || 'N/A'}</td>
                            <td>${order.upiId || '-'}</td>
                            <td>${order.transactionId || '-'}</td>
                            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '-'}</td>
                            <td>${order.status}</td>
                        </tr>
                    `).join('');
                }
            } else {
                tbody.innerHTML = '<tr><td colspan="10">Error loading orders</td></tr>';
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="10">Error loading orders</td></tr>';
        }
    } catch (error) {
        console.error('Error loading medicine orders:', error);
        const tbody = document.getElementById('medicineOrdersTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10">Error loading orders</td></tr>';
    }
}

async function loadLabBookings() {
    try {
        const response = await fetch(`${API}/consultations/lab-tests/bookings`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const tbody = document.getElementById('labBookingsTableBody');
        if (!tbody) return;

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.bookings) {
                totalLabRevenue = data.bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
                renderRevenue();

                if (data.bookings.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9">No bookings found</td></tr>';
                } else {
                    tbody.innerHTML = data.bookings.map(booking => `
                        <tr>
                            <td>${booking._id}</td>
                            <td>${booking.patientName || 'N/A'}</td>
                            <td>${booking.testName || 'N/A'}</td>
                            <td>${new Date(booking.date).toLocaleDateString()} ${booking.time || ''}</td>
                            <td>${booking.homeCollection ? 'Home' : 'Lab'}</td>
                            <td>${booking.address || '-'}</td>
                            <td>₹${booking.amount || 0}</td>
                            <td>${booking.transactionId || '-'}</td>
                            <td>${booking.status}</td>
                        </tr>
                    `).join('');
                }
            } else {
                 tbody.innerHTML = '<tr><td colspan="9">Error loading lab bookings</td></tr>';
            }
        }
    } catch (error) {
        console.error('Error loading lab bookings:', error);
        const tbody = document.getElementById('labBookingsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="9">Error loading lab bookings</td></tr>';
    }
}

async function loadAllHealthRecords() {
    try {
        const response = await fetch(`${API}/consultations/health-records?isAdmin=true`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const tbody = document.getElementById('healthRecordsTableBody');
        if (!tbody) return;

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.records) {
                if (data.records.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6">No records found</td></tr>';
                } else {
                    tbody.innerHTML = data.records.map(record => `
                        <tr>
                            <td>${record.userId?.username || 'Unknown'}</td>
                            <td>${record.title}</td>
                            <td>${record.type}</td>
                            <td>${record.description || '-'}</td>
                            <td>${new Date(record.createdAt).toLocaleDateString()}</td>
                            <td><a href="${record.fileUrl}" target="_blank">View</a></td>
                        </tr>
                    `).join('');
                }
            } else {
                tbody.innerHTML = '<tr><td colspan="6">Error loading records</td></tr>';
            }
        }
    } catch (error) {
        console.error('Error loading health records:', error);
    }
}

// Password Reset Functions
window.promptResetUserPassword = async function(userId) {
    const newPassword = prompt("Enter new password for this user:");
    if (!newPassword) return;
    
    try {
        const response = await fetch(`${API}/patients/reset-password/${userId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ password: newPassword })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Password reset successfully');
        } else {
            alert('Failed to reset password: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        alert('Error resetting password');
    }
};

window.promptResetDoctorPassword = async function(doctorId) {
    const newPassword = prompt("Enter new password for this doctor:");
    if (!newPassword) return;
    
    try {
        const response = await fetch(`${API}/doctor/reset-password/${doctorId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ password: newPassword })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Password reset successfully');
        } else {
            alert('Failed to reset password: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        alert('Error resetting password');
    }
};

// Modal functions
function openModal(type) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('modalForm');
    
    if (!modal || !title || !form) return;
    
    modal.style.display = 'block';
    if (type === 'user') {
        title.textContent = 'Add User';
        form.innerHTML = `
            <div class="form-group"><label>Username</label><input type="text" name="username" required></div>
            <div class="form-group"><label>Email</label><input type="email" name="email" required></div>
            <div class="form-group"><label>Password</label><input type="password" name="password" required></div>
            <button type="submit">Create User</button>
        `;
        form.onsubmit = createUser;
    } else if (type === 'doctor') {
        title.textContent = 'Add Doctor';
        form.innerHTML = `
            <div class="form-group"><label>Name</label><input type="text" name="name" required></div>
            <div class="form-group"><label>Email</label><input type="email" name="email" required></div>
            <div class="form-group"><label>Specialization</label><input type="text" name="specialization" required></div>
            <div class="form-group"><label>Password</label><input type="password" name="password" required></div>
            <button type="submit">Create Doctor</button>
        `;
        form.onsubmit = createDoctor;
    }
}

function openLinkModal(appointmentId) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('modalForm');
    
    if (!modal || !title || !form) return;
    
    modal.style.display = 'block';
    title.textContent = 'Assign Meeting Link';
    form.innerHTML = `
        <input type="hidden" name="appointmentId" value="${appointmentId}">
        <div class="form-group">
            <label>Meeting URL</label>
            <input type="url" name="meetLink" placeholder="https://meet.google.com/..." required style="width:100%; padding:8px;">
        </div>
        <button type="submit">Send Link</button>
    `;
    form.onsubmit = submitMeetingLink;
}

async function submitMeetingLink(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const appointmentId = formData.get('appointmentId');
    const meetLink = formData.get('meetLink');
    
    if (!appointmentId || !meetLink) {
        alert('Please enter a valid link');
        return;
    }
    
    try {
        // Use endpoint that updates appointment and creates consultation
        const response = await fetch(`${API}/consultations/${appointmentId}/link`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ meetLink })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Meeting link assigned successfully!');
            closeModal();
            loadAppointments(); // Refresh lists
            loadConsultations();
        } else {
            alert('Failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error assigning link:', error);
        alert('Error assigning link');
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// CRUD stubs & View Functions
window.viewUserDetails = function(index) {
    const user = usersData[index];
    window.location.href = `../common-profile.html?id=${user._id || user.id}&role=patient`;
};

window.viewDoctorDetails = function(index) {
    const doc = doctorsData[index];
    window.location.href = `../common-profile.html?id=${doc._id || doc.id}&role=doctor`;
};

// Stubs for viewing consultation/appointment details
window.viewAppointment = function(id) { alert('Viewing Appointment: ' + id); };
window.viewConsultation = function(id) { alert('Viewing Consultation: ' + id); };

async function createUser(e) { e.preventDefault(); alert('Create User not implemented yet'); closeModal(); }
async function createDoctor(e) { e.preventDefault(); alert('Create Doctor not implemented yet'); closeModal(); }
async function editUser(id) { alert('Edit User ' + id); }
async function deleteUser(id) { 
    if(confirm('Are you sure?')) {
        alert('Delete User ' + id); 
    }
}
async function editDoctor(id) { alert('Edit Doctor ' + id); }
async function deleteDoctor(id) {
    if(confirm('Are you sure?')) {
        alert('Delete Doctor ' + id);
    }
}

// Make global
window.openModal = openModal;
window.openLinkModal = openLinkModal;
window.closeModal = closeModal;
window.createUser = createUser;
window.createDoctor = createDoctor;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.editDoctor = editDoctor;
window.deleteDoctor = deleteDoctor;
window.loadConsultations = loadConsultations;
window.loadMedicineOrders = loadMedicineOrders;
window.loadLabBookings = loadLabBookings;
window.loadAllHealthRecords = loadAllHealthRecords;


// Main Initialization
document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleAdminLogin);
    return;
  }
  
  // If we are on admin dashboard or manage-user page
  const token = localStorage.getItem('adminToken');
  if (!token) {
    // If we are not on login page, redirect
    if (!window.location.href.includes('admin-login.html')) {
        window.location.href = 'admin-login.html';
    }
    return;
  }
  
  // Load data if on dashboard or manage page
  // We use try-catch for each to ensure one failure doesn't stop others
  
  if (document.getElementById('usersTableBody')) {
      try { await loadUsers(); } catch(e) { console.error(e); }
  }
  if (document.getElementById('doctorsTableBody')) {
      try { await loadDoctors(); } catch(e) { console.error(e); }
  }
  if (document.getElementById('appointmentsTableBody')) {
      try { await loadAppointments(); } catch(e) { console.error(e); }
  }
  if (document.getElementById('consultationsTableBody')) {
      try { await loadConsultations(); } catch(e) { console.error(e); }
  }
  if (document.getElementById('medicineOrdersTableBody')) {
      try { await loadMedicineOrders(); } catch(e) { console.error(e); }
  }
  if (document.getElementById('labBookingsTableBody')) {
      try { await loadLabBookings(); } catch(e) { console.error(e); }
  }
  if (document.getElementById('healthRecordsTableBody')) {
      try { await loadAllHealthRecords(); } catch(e) { console.error(e); }
  }
});
