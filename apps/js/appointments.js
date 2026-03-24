// apps/js/appointments.js


const API = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) || (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://localhost:5501/api';

document.addEventListener('DOMContentLoaded', async () => {
  const appointmentForm = document.getElementById('appointmentForm');
  if (!appointmentForm) return;

  
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedDoctorId = urlParams.get('doctorId');
  const preSelectedDoctorName = urlParams.get('doctorName');

  
  await loadDoctors(preSelectedDoctorId, preSelectedDoctorName);

  
  appointmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await bookAppointment();
  });
});

async function loadDoctors(preSelectedDoctorId = null, preSelectedDoctorName = null) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'user-login.html';
      return;
    }

    
    const response = await fetch(`${API}/doctor/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.doctors) {
        const doctorSelect = document.getElementById('doctor');
        if (doctorSelect) {
          doctorSelect.innerHTML = '<option value="">Select a Doctor</option>';
          data.doctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor._id || doctor.id;
            option.textContent = `Dr. ${doctor.name} - ${doctor.specialization || 'General'}`;
            if (preSelectedDoctorId && (doctor._id === preSelectedDoctorId || doctor.id === preSelectedDoctorId)) {
              option.selected = true;
            }
            doctorSelect.appendChild(option);
          });
        }
      }
    } else {
      console.warn('Could not load doctors list');
      showMessage('Could not load doctors. Please refresh the page.', 'error');
    }
  } catch (error) {
    console.error('Error loading doctors:', error);
    showMessage('Error loading doctors. Please check your connection.', 'error');
  }
}

async function bookAppointment() {
  const token = localStorage.getItem('token');
  if (!token) {
    showMessage('Please login to book an appointment.', 'error');
    window.location.href = 'user-login.html';
    return;
  }

  const doctorSelect = document.getElementById('doctor');
  const dateInput = document.getElementById('date');
  const timeInput = document.getElementById('time');
  const reasonInput = document.getElementById('reason');

  if (!doctorSelect || !dateInput || !timeInput) {
    showMessage('Error: Form fields not found. Please refresh the page.', 'error');
    return;
  }

  const doctorId = doctorSelect.value;
  const date = dateInput.value;
  const time = timeInput.value;
  const reason = reasonInput ? reasonInput.value.trim() : '';

  if (!doctorId || !date || !time) {
    showMessage('Please fill all required fields.', 'error');
    return;
  }

  
  const userData = localStorage.getItem('user');
  let patientId = null;
  if (userData) {
    try {
      const user = JSON.parse(userData);
      patientId = user._id || user.id;
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }

  if (!patientId) {
    showMessage('User information not found. Please login again.', 'error');
    window.location.href = 'user-login.html';
    return;
  }

  
  const bookingData = {
    patientId,
    doctorId,
    date,
    time,
    reason: reason || '',
    consultationFee: 500
  };

  
  localStorage.setItem('pendingBooking', JSON.stringify(bookingData));

  
  window.location.href = 'payment.html';
}

function showMessage(message, type = 'error') {
  const messageDiv = document.getElementById('message');
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.style.color = type === 'error' ? 'red' : 'green';
    messageDiv.style.marginBottom = '10px';
    messageDiv.style.display = 'block';
  }
}
