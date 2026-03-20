// apps/js/search.js - Search doctors functionality
const API = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) || (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://localhost:5501/api';

async function searchDoctors(filters = {}) {
  try {
    // Fetch all doctors from backend
    const response = await fetch(`${API}/doctor/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch doctors');
      return [];
    }

    const data = await response.json();
    let doctors = data.success && data.doctors ? data.doctors : [];

    // Filter by specialty
    if (filters.specialty && filters.specialty.trim()) {
      const specialtyLower = filters.specialty.toLowerCase();
      doctors = doctors.filter(d => 
        d.specialization && d.specialization.toLowerCase().includes(specialtyLower)
      );
    }

    // Filter by location (city or state)
    if (filters.location && filters.location.trim()) {
      const locationLower = filters.location.toLowerCase();
      doctors = doctors.filter(d => {
        if (!d.location) return false;
        const city = (d.location.city || '').toLowerCase();
        const state = (d.location.state || '').toLowerCase();
        const address = (d.location.address || '').toLowerCase();
        return city.includes(locationLower) || 
               state.includes(locationLower) || 
               address.includes(locationLower);
      });
    }

    return doctors;
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

function renderDoctors(doctors) {
  const container = document.getElementById('doctorList');
  if (!container) return;
  
  if (!doctors || doctors.length === 0) {
    container.innerHTML = '<p>No doctors found. Try adjusting your search filters.</p>';
    return;
  }

  container.innerHTML = doctors.map(d => {
    const location = d.location ? 
      `${d.location.city || ''}${d.location.city && d.location.state ? ', ' : ''}${d.location.state || ''}`.trim() || 
      d.location.address || 
      'Location not specified' : 
      'Location not specified';
    
    const hospital = d.hospital || 'Hospital not specified';
    const specialization = d.specialization || 'General';
    const experience = d.experience ? `${d.experience} years` : '';
    const qualification = d.qualification || '';
    
    // Create a slug for profile link (simple version)
    const slug = d.name ? d.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'doctor';
    
    // Adjust image path
    const image = d.profileImage 
        ? (d.profileImage.startsWith('http') ? d.profileImage : `${API.replace('/api', '')}${d.profileImage}`)
        : 'https://via.placeholder.com/150?text=Dr';

    return `
      <div class="doctor-card">
        <img src="${image}" alt="Dr. ${d.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto 10px auto;">
        <h3>Dr. ${d.name || 'Unknown'}</h3>
        <p><strong>Specialization:</strong> ${specialization}</p>
        <p><strong>Hospital:</strong> ${hospital}</p>
        <p><strong>Location:</strong> ${location}</p>
        ${experience ? `<p><strong>Experience:</strong> ${experience}</p>` : ''}
        ${qualification ? `<p><strong>Qualification:</strong> ${qualification}</p>` : ''}
        <p><strong>Email:</strong> ${d.email || 'N/A'}</p>
        <p><strong>Phone:</strong> ${d.phone || 'N/A'}</p>
        <a href="common-profile.html?id=${d._id || d.id}&role=doctor" style="display: inline-block; margin-top: 0.5rem; color: #007bff; text-decoration: none;">View Profile</a>
        <button onclick="bookWithDoctor('${d._id || d.id}', '${d.name}')" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Book Appointment</button>
      </div>
    `;
  }).join('');
}

function bookWithDoctor(doctorId, doctorName) {
  // Redirect to book appointment page with doctor pre-selected
  window.location.href = `book-appointment.html?doctorId=${doctorId}&doctorName=${encodeURIComponent(doctorName)}`;
}

function initSearchForm() {
  const form = document.getElementById('searchForm');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const filters = {
      specialty: document.getElementById('specialty').value,
      location: document.getElementById('location').value.trim()
    };
    const doctors = await searchDoctors(filters);
    renderDoctors(doctors);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Search can be public - no login required
  // But if user is logged in, we can show personalized results
  
  // Load all doctors by default
  const allDoctors = await searchDoctors();
  renderDoctors(allDoctors);
  initSearchForm();
  
  // If doctorId is in URL params, pre-select in book appointment
  const urlParams = new URLSearchParams(window.location.search);
  const doctorId = urlParams.get('doctorId');
  if (doctorId) {
    // This would be handled in book-appointment.html
  }
});