async function processPayment(paymentData) {
    try {
        // Use API_BASE_URL global
        let url = `${API_BASE_URL}/payments/process`;
        
        // Route to correct service based on type
        if (paymentData.type === 'medicines') {
            url = `${API_BASE_URL}/payments/medicines/process`;
        } else if (paymentData.type === 'lab-test') {
            url = `${API_BASE_URL}/lab-tests/book`;
        }

        const response = await fetchWithAuth(url, {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
        const result = await response.json();
        if (response.ok && result.success) {
            // In real app: integrate Razorpay SDK here
            if (['razorpay', 'upi', 'card'].includes(paymentData.method)) {
                // Mock success
            }
            
            // Handle Lab Test Redirection specific
            if (paymentData.type === 'lab-test') {
                 window.location.href = `payment-confirmation-lab.html?bookingId=${result.booking._id}`;
                 return true;
            }
            
            return true;
        } else {
            throw new Error(result.message || 'Payment failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showMessage('Payment failed: ' + error.message, 'error');
        return false;
    }
}

// Reuse showMessage from auth.js
function showMessage(message, type = 'error') {
    const div = document.getElementById('message');
    if (div) {
        div.textContent = message;
        div.className = type;
        div.style.display = 'block';
    }
}