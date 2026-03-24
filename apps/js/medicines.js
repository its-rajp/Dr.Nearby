// dr-nearby/js/medicines.js
let cart = [];


async function fetchMedicines() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/medicines`);
        const data = await response.json();
        if (response.ok) {
            renderMedicines(data.medicines || []); 
        } else {
            throw new Error('Failed to load medicines');
        }
    } catch (error) {
        console.error('Error fetching medicines:', error);
        const container = document.getElementById('medicinesContainer');
        if (container) container.innerHTML = '<p>Unable to load medicines. Please try again later.</p>';
    }
}


function renderMedicines(medicines) {
    const container = document.getElementById('medicinesContainer');
    if (!container) return;
    container.innerHTML = medicines.map(med => `
        <div class="medicine-item">
            <div>
                <strong>${med.name}</strong><br>
                <small>${med.description || 'No description'}</small><br>
                <em>₹${med.price} • ${med.quantity} available</em>
            </div>
            <div>
                <input type="number" min="1" max="${med.quantity}" value="1" id="qty-${med._id}" style="width:60px; margin-right:10px;">
                <button onclick="addToCart('${med._id}', '${med.name}', ${med.price})">Add</button>
            </div>
        </div>
    `).join('');
}


function addToCart(id, name, price) {
    const qtyInput = document.getElementById(`qty-${id}`);
    const qty = parseInt(qtyInput.value) || 1;
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({ id, name, price, quantity: qty });
    }
    updateCartSummary();
    showMessage(`${name} added to cart!`, 'success');
}


function updateCartSummary() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const countEl = document.getElementById('cartCount');
    const totalEl = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (countEl) countEl.textContent = count;
    if (totalEl) totalEl.textContent = total.toFixed(2);
    if (checkoutBtn) checkoutBtn.disabled = count === 0;
}


async function checkout() {
    if (cart.length === 0) return;

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: cart })
        });

        const data = await response.json();
        if (data.success) {
            showMessage('Order placed successfully! Redirecting...', 'success');
            cart = [];
            updateCartSummary();
            
            setTimeout(() => {
                window.location.href = `../payment/payment-medicine.html?orderId=${data.orderId}`;
            }, 1500);
        } else {
            showMessage(data.message || 'Failed to place order', 'error');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showMessage('Error processing checkout', 'error');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    fetchMedicines();
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
});


window.addToCart = addToCart;
window.fetchMedicines = fetchMedicines;