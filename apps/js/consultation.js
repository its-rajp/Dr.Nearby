// apps/js/consultation.js
const API = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) || (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://localhost:5501/api';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../user-login.html';
        return;
    }

    await loadDoctors();
    await loadNotifications();
    await loadMyConsultations();

    const form = document.getElementById('consultationForm');
    if (form) {
        form.addEventListener('submit', handleConsultationRequest);
    }
});

async function loadDoctors() {
    try {
        const res = await fetch(`${API}/doctor/list`); 
        
        
        
        
        
        
        if (!res.ok) {
             
             console.log('Failed to load doctors');
             return;
        }
        const data = await res.json();
        const select = document.getElementById('doctor');
        if (data.success && data.doctors) {
            select.innerHTML = '<option value="">Choose a doctor</option>' + 
                data.doctors.map(doc => `<option value="${doc._id}">${doc.name} (${doc.specialization})</option>`).join('');
        }
    } catch (e) {
        console.error('Error loading doctors', e);
    }
}

async function loadNotifications() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    const userId = user._id || user.id;

    try {
        
        const res = await fetch(`${API}/consultations?userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        const list = document.getElementById('notificationsList');
        
        if (data.success && data.consultations) {
            
            const notifications = data.consultations.filter(c => c.status === 'scheduled' || c.status === 'active');
            
            if (notifications.length > 0) {
                list.innerHTML = notifications.map(c => `
                    <div class="notification-item" style="padding:10px; border-left:4px solid #007bff; background:#f8f9fa; margin-bottom:10px; border-radius:4px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <strong>Meeting Scheduled!</strong><br>
                                <small>Dr. ${c.doctorId?.name || 'Unknown'} - ${new Date(c.date).toLocaleDateString()} @ ${c.timeSlot}</small>
                            </div>
                            <a href="../meeting-gate.html?id=${c._id}" target="_blank" class="btn-primary" style="padding:5px 10px; text-decoration:none; border-radius:4px; font-size:0.9em;">Join Meeting</a>
                        </div>
                    </div>
                `).join('');
            } else {
                list.innerHTML = '<p style="color:#666; font-style:italic;">No upcoming meetings.</p>';
            }
        }
    } catch (e) {
        console.error('Error loading notifications', e);
    }
}

async function loadMyConsultations() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    
    const userId = user._id || user.id;
    if (!userId) {
        console.warn('User ID missing in localStorage');
        return;
    }

    try {
        
        const res = await fetch(`${API}/consultations?userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        const container = document.getElementById('consultationsList');
        
        if (data.success && data.consultations && data.consultations.length > 0) {
            container.innerHTML = data.consultations.map(c => `
                <div class="consultation-item" style="border:1px solid #ddd; padding:15px; margin-bottom:15px; border-radius:8px; background:white;">
                    <h3 style="color:#007bff; margin-top:0;">Consultation with Dr. ${c.doctorId?.name || 'Unknown'}</h3>
                    <p><span class="status-badge status-${c.status}" style="background:${c.status === 'active' ? '#d4edda' : (c.status === 'confirmed' || c.status === 'in_progress' ? '#cce5ff' : '#fff3cd')}; color:${c.status === 'active' ? '#155724' : (c.status === 'confirmed' || c.status === 'in_progress' ? '#004085' : '#856404')}; padding:2px 8px; border-radius:10px; font-size:0.8rem;">${c.status.toUpperCase()}</span></p>
                    <p><strong>Date:</strong> ${new Date(c.date).toLocaleDateString()}</p>
                    <p><strong>Time Slot:</strong> ${c.timeSlot}</p>
                    <p><strong>Symptoms:</strong> ${c.symptoms || '—'}</p>
                    <p><strong>Fee:</strong> <span style="color:#28a745; font-weight:bold;">₹500 (Paid)</span></p>
                    ${c.meetLink ? `<p><strong>Meeting Link:</strong> <a href="../meeting-gate.html?id=${c._id}" target="_blank">Open Meeting Gate</a></p>` : ''}
                    
                    <div style="margin-top:10px;">
                        ${c.meetLink || c.status === 'confirmed' || c.status === 'pending' ? 
                            `<a href="../meeting-gate.html?id=${c._id}" class="btn-primary" style="display:inline-block; padding:8px 16px; background:#007bff; color:white; text-decoration:none; border-radius:4px; margin-right:10px;">${c.meetLink ? 'Join Meeting' : 'View Status / Pay'}</a>` 
                            : ''}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>No consultations found.</p>';
        }
    } catch (e) {
        console.error('Error loading consultations', e);
        document.getElementById('consultationsList').innerHTML = '<p>Error loading consultations.</p>';
    }
}

let pendingConsultationData = null;

async function handleConsultationRequest(e) {
    e.preventDefault();
    const doctorId = document.getElementById('doctor').value;
    const date = document.getElementById('date').value;
    const timeSlot = document.getElementById('timeSlot').value;
    const symptoms = document.getElementById('symptoms').value;
    const user = JSON.parse(localStorage.getItem('user'));

    if (!doctorId || !date || !timeSlot || !symptoms) {
        alert('Please fill all required fields');
        return;
    }

    
    pendingConsultationData = {
        userId: user._id || user.id,
        doctorId,
        date,
        timeSlot,
        symptoms,
        paymentStatus: 'paid',
        amount: 500
    };

    
    document.getElementById('paymentModal').style.display = 'block';
    document.getElementById('paymentOptions').style.display = 'block';
    document.getElementById('paymentProcessing').style.display = 'none';
    document.getElementById('paymentSuccess').style.display = 'none';
}

async function processPayment(method) {
    // 1. Show processing state
    document.getElementById('paymentOptions').style.display = 'none';
    document.getElementById('paymentProcessing').style.display = 'block';

    // 2. Simulate bank delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        // 3. Send Request to backend ONLY after successful payment simulation
        const res = await fetch(`${API}/consultations/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(pendingConsultationData)
        });

        const data = await res.json();

        if (data.success) {
            // 4. Show success state
            document.getElementById('paymentProcessing').style.display = 'none';
            document.getElementById('paymentSuccess').style.display = 'block';
            
            // 5. Reload after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            alert(data.message || 'Payment failed or request rejected');
            closePaymentModal();
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred during payment verification');
        closePaymentModal();
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    pendingConsultationData = null;
}


window.processPayment = processPayment;
window.closePaymentModal = closePaymentModal;

