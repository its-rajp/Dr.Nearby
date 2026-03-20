
    // Use 'let' or 'var' to avoid conflicts if script is reloaded or included multiple times
    var HEALTH_RECORDS_API = (typeof API !== 'undefined' && API) || (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://localhost:5501/api';

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure auth
    if (typeof protectPage === 'function') {
        await protectPage();
    }
    
    loadHealthRecords();
    loadDoctorsForUpload(); // Load doctors for the upload dropdown

    const form = document.getElementById('uploadRecordForm');
    if (form) {
        form.addEventListener('submit', handleUpload);
    }
});

let doctorsMap = {};

let doctorsList = [];

async function fetchDoctorsMap() {
    try {
        const response = await fetch(`${HEALTH_RECORDS_API}/doctor/list`);
        const data = await response.json();
        if (data.success && data.doctors) {
            doctorsList = data.doctors; // Store full list for searching
            data.doctors.forEach(d => {
                doctorsMap[d._id] = d.name;
                doctorsMap[d.id] = d.name;
            });
            return data.doctors; // Return list for dropdowns
        }
    } catch (error) {
        console.error('Error fetching doctors map:', error);
    }
    return [];
}

// ... existing code ...

// Share Functionality
let currentRecordId = null;

async function openShareModal(recordId, recordType) {
    currentRecordId = recordId;
    const modal = document.getElementById('shareModal');
    const title = document.getElementById('shareDocTitle');
    title.textContent = `Sharing: ${formatType(recordType)}`;
    modal.style.display = 'block';
    
    // Ensure doctors are loaded
    if (doctorsList.length === 0) {
        await fetchDoctorsMap();
    }
    
    // Reset search input
    const searchInput = document.getElementById('doctorSearch');
    const hiddenId = document.getElementById('selectedDoctorId');
    const resultsDiv = document.getElementById('doctorSearchResults');
    if (searchInput) searchInput.value = '';
    if (hiddenId) hiddenId.value = '';
    if (resultsDiv) {
        resultsDiv.innerHTML = '';
        resultsDiv.style.display = 'none';
    }
}

function searchDoctors(query) {
    const resultsDiv = document.getElementById('doctorSearchResults');
    const hiddenId = document.getElementById('selectedDoctorId');
    
    // Clear selection if user types again
    if (hiddenId) hiddenId.value = '';

    if (!query || query.trim().length === 0) {
        resultsDiv.innerHTML = '';
        resultsDiv.style.display = 'none';
        return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = doctorsList.filter(d => 
        d.name.toLowerCase().includes(lowerQuery) || 
        (d.specialization && d.specialization.toLowerCase().includes(lowerQuery))
    );

    if (filtered.length > 0) {
        resultsDiv.innerHTML = filtered.map(d => `
            <div style="padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;" 
                 onmouseover="this.style.backgroundColor='#f0f0f0'" 
                 onmouseout="this.style.backgroundColor='white'"
                 onclick="selectDoctor('${d._id || d.id}', '${d.name}')">
                <strong>Dr. ${d.name}</strong> <small>(${d.specialization})</small>
            </div>
        `).join('');
        resultsDiv.style.display = 'block';
    } else {
        resultsDiv.innerHTML = '<div style="padding: 8px; color: #666;">No doctors found</div>';
        resultsDiv.style.display = 'block';
    }
}

function selectDoctor(id, name) {
    const searchInput = document.getElementById('doctorSearch');
    const hiddenId = document.getElementById('selectedDoctorId');
    const resultsDiv = document.getElementById('doctorSearchResults');

    if (searchInput) searchInput.value = `Dr. ${name}`;
    if (hiddenId) hiddenId.value = id;
    if (resultsDiv) resultsDiv.style.display = 'none';
}

function closeShareModal() {
    document.getElementById('shareModal').style.display = 'none';
    currentRecordId = null;
}

// ... remove loadDoctorsForShare as it's replaced by search ...

async function loadDoctorsForUpload() {
    const select = document.getElementById('uploadDoctorSelect');
    if (!select) return;

    try {
        // Ensure doctors are loaded
        if (doctorsList.length === 0) {
            await fetchDoctorsMap();
        }
        
        if (doctorsList && doctorsList.length > 0) {
            select.innerHTML = '<option value="">-- Select Doctor --</option>' + 
                doctorsList.map(d => `<option value="${d._id || d.id}">Dr. ${d.name} (${d.specialization})</option>`).join('');
        } else {
            select.innerHTML = '<option value="">No doctors found</option>';
        }
    } catch (error) {
        console.error('Failed to load doctors for upload:', error);
    }
}

async function confirmShare() {
    const doctorId = document.getElementById('selectedDoctorId').value;
    if (!doctorId || !currentRecordId) {
        alert('Please search and select a doctor from the list');
        return;
    }
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${HEALTH_RECORDS_API}/patients/health-records/${currentRecordId}/share`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ doctorId })
        });

        const data = await response.json();
        if (data.success) {
            alert('Document shared successfully!');
            closeShareModal();
            loadHealthRecords(); // Reload to update shared list
        } else {
            alert(data.message || 'Sharing failed');
        }
    } catch (error) {
        console.error('Share error:', error);
        alert('Sharing failed');
    }
}

// Close modal if clicked outside
window.onclick = function(event) {
    const modal = document.getElementById('shareModal');
    if (event.target == modal) {
        closeShareModal();
    }
}

function formatType(type) {
    const map = {
        'prescription': 'Prescription',
        'lab_report': 'Lab Report',
        'x_ray': 'X-Ray',
        'other': 'Other',
        'Report': 'Lab Report',
        'Prescription': 'Prescription',
        'X-Ray': 'X-Ray',
        'Other': 'Other'
    };
    return map[type] || type;
}

async function handleUpload(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if(submitBtn) submitBtn.disabled = true;

    const title = document.getElementById('recordTitle').value;
    const type = document.getElementById('recordType').value;
    const description = document.getElementById('recordDescription').value;
    const fileInput = document.getElementById('recordFile');
    const doctorId = document.getElementById('uploadDoctorSelect')?.value;

    if (fileInput.files.length === 0) {
        alert('Please select a file');
        if(submitBtn) submitBtn.disabled = false;
        return;
    }

    const formData = new FormData();
    formData.append('type', type);
    // Combine title and description into notes as backend expects 'notes'
    const fullNotes = title ? `${title}\n${description}` : description;
    formData.append('notes', fullNotes);
    formData.append('file', fileInput.files[0]);
    if (doctorId) {
        formData.append('sharedWith', doctorId);
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${HEALTH_RECORDS_API}/patients/health-records`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Content-Type not set for FormData, browser sets it with boundary
            },
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            alert('Health record uploaded successfully!');
            e.target.reset();
            loadHealthRecords();
        } else {
            alert(data.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed');
    } finally {
        if(submitBtn) submitBtn.disabled = false;
    }
}

// Helper for auth fetch if not in config
// Re-implementing just in case it's missing or to be self-contained
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // If body is FormData, delete Content-Type to let browser handle boundary
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        // Optional: redirect to login
        // window.location.href = 'user-login.html';
    }
    
    return response;
}
