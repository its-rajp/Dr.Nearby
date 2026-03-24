// apps/js/payment-page.js
const API = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) || (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://localhost:5501/api';

document.addEventListener('DOMContentLoaded', () => {
    const bookingData = localStorage.getItem('pendingBooking');
    if (!bookingData) {
        alert('No pending booking found.');
        window.location.href = 'dashboard.html';
        return;
    }

    const booking = JSON.parse(bookingData);
    
    
    // (Ideally we would fetch doctor name again or store it in pendingBooking)
    
    
    selectMethod('card');
});

function selectMethod(method) {
    document.querySelectorAll('.method-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(method).parentElement.classList.add('selected');
    document.getElementById(method).checked = true;
}

async function processPayment() {
    const btn = document.getElementById('payBtn');
    const msg = document.getElementById('message');
    
    btn.disabled = true;
    btn.textContent = 'Processing...';
    msg.textContent = '';

    const bookingData = JSON.parse(localStorage.getItem('pendingBooking'));
    const token = localStorage.getItem('token');

    try {
        
        if (!bookingData.patientId || typeof bookingData.patientId !== 'string' || bookingData.patientId.length < 24) {
            throw new Error(`Invalid Patient ID: ${bookingData.patientId}. Please login again.`);
        }
        if (!bookingData.doctorId || typeof bookingData.doctorId !== 'string' || bookingData.doctorId.length < 24) {
             throw new Error(`Invalid Doctor ID: ${bookingData.doctorId}. Please re-select doctor.`);
        }

        
        await new Promise(resolve => setTimeout(resolve, 2000));

        
        console.log('Sending booking data:', {
            ...bookingData,
            paymentStatus: 'paid',
            consultationFee: 500
        });

        const response = await fetch(`${API}/appointments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...bookingData,
                paymentStatus: 'paid', 
                consultationFee: 500
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            
            const receipt = {
                txnId: 'TXN' + Math.floor(Math.random() * 10000000),
                amount: 500,
                doctorName: 'Dr. Nearby Specialist', 
                date: new Date()
            };
            localStorage.setItem('lastReceipt', JSON.stringify(receipt));
            
            
            localStorage.removeItem('pendingBooking');

            
            window.location.href = 'confirmation.html';
        } else {
            throw new Error(data.message || 'Booking failed');
        }

    } catch (error) {
        console.error('Payment Error:', error);
        msg.textContent = 'Payment Failed: ' + error.message;
        msg.style.color = 'red';
        btn.disabled = false;
        btn.textContent = 'Pay ₹500.00';
    }
}