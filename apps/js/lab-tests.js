// apps/js/lab-tests.js - Lab tests booking
const API = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) || (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://localhost:5501/api';

document.addEventListener('DOMContentLoaded', async () => {
  await loadLabTests();
  const form = document.getElementById('labBookingForm');
  if (form) form.addEventListener('submit', handleLabBooking);
});

async function loadLabTests() {
  try {
    const res = await fetch(`${API}/lab-tests`);
    const data = await res.json().catch(() => ({}));
    const tests = (data.tests || []).slice(0, 20);
    const container = document.getElementById('testsContainer');
    const select = document.getElementById('test');
    if (container) {
      container.innerHTML = tests.length ? tests.map(t => `
        <div class="test-card">
          <h3>${t.name}</h3>
          <p>${t.description || ''}</p>
          <p><strong>₹${t.price || 0}</strong></p>
        </div>
      `).join('') : '<p>No lab tests available.</p>';
    }
    if (select) {
      select.innerHTML = '<option value="">Choose a test</option>' + tests.map(t =>
        `<option value="${t._id || t.id}" data-price="${t.price || 0}">${t.name} - ₹${t.price || 0}</option>`
      ).join('');
    }
  } catch (e) {
    const container = document.getElementById('testsContainer');
    if (container) container.innerHTML = '<p>Unable to load lab tests.</p>';
  }
}

async function handleLabBooking(e) {
  e.preventDefault();
  const form = e.target;
  const testEl = document.getElementById('test');
  const dateEl = document.getElementById('date');
  const addressEl = document.getElementById('address');
  const msg = document.getElementById('message');
  
  if (!testEl || !dateEl || !addressEl || !msg) return;
  
  const token = localStorage.getItem('token');
  if (!token) {
    msg.textContent = 'Please log in to book a test.';
    msg.style.color = 'red';
    return;
  }

  // Redirect to Payment Page
  const testId = testEl.value;
  const price = testEl.options[testEl.selectedIndex]?.getAttribute('data-price');
  const testName = testEl.options[testEl.selectedIndex]?.text.split(' - ')[0];
  const date = dateEl.value;
  const address = addressEl.value.trim();

  if (!testId || !price) {
      msg.textContent = 'Please select a valid test.';
      msg.style.color = 'red';
      return;
  }

  const params = new URLSearchParams({
      testId,
      testName,
      price,
      date,
      address
  });

  window.location.href = `../payment/payment-lab.html?${params.toString()}`;
}
