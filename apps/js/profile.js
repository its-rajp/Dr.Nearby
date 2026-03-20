// apps/js/profile.js

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = 'user-login.html'; // Redirect to login if no token
    return;
  }

  // Elements from the new HTML structure
  const profileDetails = document.getElementById('profile-details');
  const profileForm = document.getElementById('profile-form');
  const editProfileButton = document.getElementById('edit-profile-button');
  const cancelEditButton = document.getElementById('cancel-edit-button');
  const editForm = document.getElementById('editForm');
  const uploadPhotoBtn = document.getElementById('upload-photo-btn');
  const photoUploadInput = document.getElementById('photo-upload-input');

  // Load initial data
  fetchProfile(token);
  fetchMedicalHistory(token);

  // Toggle View/Edit Mode
  if (editProfileButton) {
    editProfileButton.addEventListener('click', () => {
      profileDetails.style.display = 'none';
      profileForm.style.display = 'block';
    });
  }
  
  if (cancelEditButton) {
    cancelEditButton.addEventListener('click', () => {
      profileForm.style.display = 'none';
      profileDetails.style.display = 'block';
    });
  }

  // Handle Form Submit
  if (editForm) {
    editForm.addEventListener('submit', (e) => handleProfileUpdate(e, token));
  }

  // Handle Profile Photo Upload
  if (uploadPhotoBtn && photoUploadInput) {
      uploadPhotoBtn.addEventListener('click', () => {
          photoUploadInput.click();
      });

      photoUploadInput.addEventListener('change', async (e) => {
          if (e.target.files && e.target.files[0]) {
              await handlePhotoUpload(e.target.files[0], token);
          }
      });
  }

  // Medical History Edit/Cancel buttons
  const editMedicalHistoryButton = document.getElementById('edit-medical-history-button');
  const cancelMedicalHistoryButton = document.getElementById('cancel-medical-history-button');
  const medicalHistoryForm = document.getElementById('medicalHistoryForm');
  const medicalHistoryView = document.getElementById('medical-history-view');
  const medicalHistoryEdit = document.getElementById('medical-history-form');

  if (editMedicalHistoryButton) {
    editMedicalHistoryButton.addEventListener('click', () => {
      if (medicalHistoryView) medicalHistoryView.style.display = 'none';
      if (medicalHistoryEdit) medicalHistoryEdit.style.display = 'block';
    });
  }

  if (cancelMedicalHistoryButton) {
    cancelMedicalHistoryButton.addEventListener('click', () => {
      if (medicalHistoryEdit) medicalHistoryEdit.style.display = 'none';
      if (medicalHistoryView) medicalHistoryView.style.display = 'block';
      // Reload medical history to cancel changes
      fetchMedicalHistory(token);
    });
  }

  if (medicalHistoryForm) {
    medicalHistoryForm.addEventListener('submit', (e) => handleMedicalHistoryUpdate(e, token));
  }
});

async function fetchProfile(token) {
  try {
    // GET /api/patients/profile -> Gateway -> Patient Service
    const response = await fetch(`${API_BASE_URL}/patients/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON, show a generic error
      showMessage(`Failed to load profile. Server returned status ${response.status}. Please try again.`, 'error');
      return;
    }

    if (!response.ok) {
      // Handle HTTP error status codes (401, 404, 500, etc.)
      if (response.status === 401) {
        // Token expired or invalid, redirect to login
        showMessage('Session expired. Please log in again.', 'error');
        setTimeout(() => {
          window.location.href = 'user-login.html';
        }, 2000);
        return;
      }
      showMessage(data.message || `Failed to load profile. Status: ${response.status}`, 'error');
      return;
    }

    if (data.success) {
      const user = data.user;
      
      // Populate View Mode Elements (New IDs) with null checks
      const displayName = document.getElementById('display-name');
      const displayEmail = document.getElementById('display-email');
      const displayPhone = document.getElementById('display-phone');
      const displayDob = document.getElementById('display-dob');
      const displayBloodGroup = document.getElementById('display-blood-group');
      const displayPhoto = document.getElementById('display-photo');
      
      if (displayName) displayName.textContent = user.username || '';
      if (displayEmail) displayEmail.textContent = user.email || '';
      if (displayPhone) displayPhone.textContent = user.phone || 'Not set';
      if (displayDob) {
        displayDob.textContent = user.dob ? new Date(user.dob).toLocaleDateString() : 'Not set';
      }
      if (displayBloodGroup) {
          // Explicitly handle null, undefined, or empty string
          // The backend might return it as undefined if not set, or string if set
          if (user.bloodGroup && user.bloodGroup !== 'undefined' && user.bloodGroup.trim() !== '') {
              displayBloodGroup.textContent = user.bloodGroup;
          } else {
              displayBloodGroup.textContent = 'N/A';
          }
      }
      if (displayPhoto && user.profileImage) {
          // Adjust path if needed (e.g., if API returns relative path)
          const imgUrl = user.profileImage.startsWith('http') ? user.profileImage : `${API_BASE_URL.replace('/api', '')}${user.profileImage}`;
          displayPhoto.src = imgUrl;
      }

      // Populate Edit Form Fields (New IDs) with null checks
      const editName = document.getElementById('edit-name');
      const editEmail = document.getElementById('edit-email');
      const editPhone = document.getElementById('edit-phone');
      const editDob = document.getElementById('edit-dob');
      const editBloodGroup = document.getElementById('edit-blood-group');
      
      if (editName) editName.value = user.username || '';
      if (editEmail) editEmail.value = user.email || '';
      if (editPhone) editPhone.value = user.phone || '';
      if (editBloodGroup) editBloodGroup.value = user.bloodGroup || '';
      
      if (user.dob && editDob) {
        // Format date to YYYY-MM-DD for input type="date"
        const date = new Date(user.dob);
        const formattedDate = date.toISOString().split('T')[0];
        editDob.value = formattedDate;
      }
    } else {
      showMessage('Error loading profile: ' + (data.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    showMessage('Network error loading profile. Please check your connection and try again.', 'error');
  }
}

async function handleProfileUpdate(e, token) {
  e.preventDefault();
  
  // Get form elements
  const nameField = document.getElementById('edit-name');
  const emailField = document.getElementById('edit-email');
  const phoneField = document.getElementById('edit-phone');
  const dobField = document.getElementById('edit-dob');
  const bloodGroupField = document.getElementById('edit-blood-group');

  // Validate required fields
  if (!nameField || !emailField || !phoneField || !dobField) {
    showMessage('Error: Form fields not found. Please refresh the page.', 'error');
    return;
  }

  const updatedData = {
    username: nameField.value.trim(),
    email: emailField.value.trim(),
    phone: phoneField.value.trim(),
    dob: dobField.value,
    bloodGroup: bloodGroupField ? bloodGroupField.value : undefined
  };

  // Basic validation
  if (!updatedData.username || !updatedData.email || !updatedData.phone || !updatedData.dob) {
    showMessage('Please fill all required fields.', 'error');
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(updatedData.email)) {
    showMessage('Please enter a valid email address.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/patients/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON, show a generic error
      showMessage(`Failed to update profile. Server returned status ${response.status}. Please try again.`, 'error');
      return;
    }

    if (!response.ok) {
      // Handle HTTP error status codes (400, 401, 409, 500, etc.)
      if (response.status === 401) {
        // Token expired or invalid, redirect to login
        showMessage('Session expired. Please log in again.', 'error');
        setTimeout(() => {
          window.location.href = 'user-login.html';
        }, 2000);
        return;
      }
      showMessage(data.message || `Failed to update profile. Status: ${response.status}`, 'error');
      return;
    }

    if (data.success) {
      showMessage('Profile updated successfully!', 'success');
      await fetchProfile(token); // Refresh the view data
      
      // Switch back to view mode with null checks
      const profileForm = document.getElementById('profile-form');
      const profileDetails = document.getElementById('profile-details');
      if (profileForm) profileForm.style.display = 'none';
      if (profileDetails) profileDetails.style.display = 'block';
    } else {
      showMessage(data.message || 'Update failed.', 'error');
    }
  } catch (error) {
    console.error('Profile update error:', error);
    showMessage('Network error updating profile. Please check your connection and try again.', 'error');
  }
}

async function handlePhotoUpload(file, token) {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showMessage('File size too large. Max 5MB.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/patients/profile/upload-photo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Content-Type not needed for FormData, browser sets it automatically
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showMessage('Profile photo uploaded successfully!', 'success');
            // Update the image immediately
            const displayPhoto = document.getElementById('display-photo');
            if (displayPhoto) {
                 const imgUrl = data.imageUrl.startsWith('http') ? data.imageUrl : `${API_BASE_URL.replace('/api', '')}${data.imageUrl}`;
                 displayPhoto.src = imgUrl;
            }
        } else {
            showMessage(data.message || 'Photo upload failed', 'error');
        }
    } catch (error) {
        console.error('Photo upload error:', error);
        showMessage('Network error uploading photo', 'error');
    }
}

async function fetchMedicalHistory(token) {
  try {
    const base = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) || (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://localhost:5501/api';
    const baseStr = String(base || '').trim().replace(/\/$/, '');
    const url = (baseStr || 'http://localhost:5501/api') + '/medical-history';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      showMessage(`Failed to load medical history. Server returned status ${response.status}.`, 'error');
      return;
    }

    if (!response.ok) {
      if (response.status === 401) {
        showMessage('Session expired. Please log in again.', 'error');
        setTimeout(() => {
          window.location.href = 'user-login.html';
        }, 2000);
        return;
      }
      showMessage(data.message || 'Failed to load medical history.', 'error');
      return;
    }

    if (data.success) {
      const history = data.medicalHistory || {}; // Handle null history
      
      // Populate view mode
      const displayAllergies = document.getElementById('display-allergies');
      const displayMedications = document.getElementById('display-medications');
      const displayConditions = document.getElementById('display-conditions');
      
      if (displayAllergies) {
        displayAllergies.textContent = history.allergies || 'None';
      }
      if (displayMedications) {
        displayMedications.textContent = history.currentMedications || 'None';
      }
      if (displayConditions) {
        displayConditions.textContent = history.pastConditions || 'None';
      }

      // Populate edit form
      const editAllergies = document.getElementById('edit-allergies');
      const editMedications = document.getElementById('edit-medications');
      const editConditions = document.getElementById('edit-conditions');
      
      if (editAllergies) editAllergies.value = history.allergies || '';
      if (editMedications) editMedications.value = history.currentMedications || '';
      if (editConditions) editConditions.value = history.pastConditions || '';
    }
  } catch (error) {
    console.error('Medical history fetch error:', error);
    showMessage('Network error loading medical history. Please check your connection and try again.', 'error');
  }
}

async function handleMedicalHistoryUpdate(e, token) {
  e.preventDefault();

  // Use Gateway /api/medical-history (never relative or Patient port) so request reaches /patient/medical-history
  const base = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) || (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://localhost:5501/api';
  const baseStr = String(base || '').trim().replace(/\/$/, '');
  const url = (baseStr || 'http://localhost:5501/api') + '/medical-history';
  if (!url.startsWith('http') || !url.includes('/medical-history')) {
    showMessage('Configuration error: API URL not set. Please refresh the page.', 'error');
    return;
  }

  const allergiesField = document.getElementById('edit-allergies');
  const medicationsField = document.getElementById('edit-medications');
  const conditionsField = document.getElementById('edit-conditions');

  if (!allergiesField || !medicationsField || !conditionsField) {
    showMessage('Error: Form fields not found. Please refresh the page.', 'error');
    return;
  }

  const updatedData = {
    allergies: allergiesField.value.trim(),
    currentMedications: medicationsField.value.trim(),
    pastConditions: conditionsField.value.trim()
  };

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      showMessage(`Failed to update medical history. Server returned status ${response.status}.`, 'error');
      return;
    }

    if (!response.ok) {
      if (response.status === 401) {
        showMessage('Session expired. Please log in again.', 'error');
        setTimeout(() => {
          window.location.href = 'user-login.html';
        }, 2000);
        return;
      }
      showMessage(data.message || `Failed to update medical history. Status: ${response.status}`, 'error');
      return;
    }

    if (data.success) {
      showMessage('Medical history updated successfully!', 'success');
      await fetchMedicalHistory(token); // Refresh the view data
      
      // Switch back to view mode
      const medicalHistoryEdit = document.getElementById('medical-history-form');
      const medicalHistoryView = document.getElementById('medical-history-view');
      if (medicalHistoryEdit) medicalHistoryEdit.style.display = 'none';
      if (medicalHistoryView) medicalHistoryView.style.display = 'block';
    } else {
      showMessage(data.message || 'Update failed.', 'error');
    }
  } catch (error) {
    console.error('Medical history update error:', error);
    showMessage('Network error updating medical history. Please check your connection and try again.', 'error');
  }
}

function showMessage(msg, type) {
  const msgDiv = document.getElementById('message');
  if (msgDiv) {
    msgDiv.textContent = msg;
    msgDiv.style.color = type === 'error' ? 'red' : 'green';
    msgDiv.style.marginBottom = '10px';
  }
}