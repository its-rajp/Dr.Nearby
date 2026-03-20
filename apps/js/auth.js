/**
 * Displays a message to the user in the #message div.
 * @param {string} message The message to display.
 * @param {string} type 'success' or 'error' for styling.
 */
function showMessage(message, type = 'info') {
  const messageDiv = document.getElementById('message');
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
  }
}

// --- Authentication State Management ---

/**
 * Saves the authentication token and user data to localStorage.
 * @param {string} token The JWT token.
 * @param {object} user The user object.
 */
function saveAuthData(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Retrieves the authentication token from localStorage.
 * @returns {string|null} The token or null if not found.
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Retrieves the current user's data from localStorage.
 * @returns {object|null} The user object or null if not found.
 */
function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

/**
 * Clears authentication data and redirects to the start page.
 */
function logoutUser() {
  // Clear all potential tokens to ensure clean logout
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  localStorage.removeItem('doctorToken');
  localStorage.removeItem('doctorData');
  localStorage.removeItem('doctorEmail');
  
  // Redirect to the logout page
  window.location.href = '/apps/logout.html';
}

// Make logoutUser globally accessible for onclick handlers
window.logoutUser = logoutUser;
// Also alias as logout for consistency
window.logout = logoutUser;

// --- Page Protection & Authenticated Fetch ---

/**
 * Checks if a user is authenticated. If not, redirects to the login page.
 * This should be called at the start of any script for a protected page.
 * @returns {boolean} True if the user is logged in, false otherwise.
 */
async function protectPage() {
  const token = getToken();
  if (!token) {
    // If there's no token, redirect to the login page.
    window.location.href = 'user-login.html';
    return false
  }
  return true;
}

/**
 * A wrapper for the fetch API that includes the Authorization header.
 * @param {string} url The URL to fetch.
 * @param {object} options Fetch options.
 * @returns {Promise<Response>} The fetch Response object.
 */
async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // If the token is invalid or expired, log the user out.
    logoutUser();
  }

  return response;
}

// --- Event Listeners for Login/Registration Forms ---

document.addEventListener('DOMContentLoaded', () => {
  // Attach listener for the login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const apiUrl = `${API_BASE_URL}/auth/login`;
        console.log('Attempting login to:', apiUrl);
        console.log('Request body:', { email, password: '***' });
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        console.log('Login response status:', response.status);
        console.log('Login response headers:', response.headers);
        
        // Check if we got a response at all
        if (!response) {
          showMessage('Cannot connect to server. Please ensure the API Gateway is running on port 5501.', 'error');
          return;
        }
        
        let data;
        try {
          const text = await response.text();
          console.log('Login response text:', text);
          if (!text) {
            showMessage('Empty response from server. Please check if Patient Service is running.', 'error');
            return;
          }
          data = JSON.parse(text);
          console.log('Login response data:', { ...data, token: data.token ? '***' : undefined });
        } catch (jsonError) {
          // If response is not JSON, show a generic error
          console.error('JSON parse error:', jsonError);
          showMessage(`Server error. Status: ${response.status}. Response might not be JSON. Please check if services are running.`, 'error');
          return;
        }
        
        if (!response.ok) {
          // Handle HTTP error status codes (400, 401, 500, etc.)
          const errorMsg = data?.message || `Login failed. Server returned status ${response.status}.`;
          console.error('Login failed:', errorMsg);
          showMessage(errorMsg, 'error');
          return;
        }
        
        if (data.success) {
          console.log('Login successful!');
          saveAuthData(data.token, data.user);
          showMessage('Login successful! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = 'index.html'; // Redirect to dashboard
          }, 500);
        } else {
          const errorMsg = data?.message || 'Login failed.';
          console.error('Login failed:', errorMsg);
          showMessage(errorMsg, 'error');
        }
      } catch (error) {
        console.error('Login error:', error);
        let errorMsg = 'An error occurred during login.';
        
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
          errorMsg = 'Cannot connect to server. Please ensure:\n1. API Gateway is running (port 5501)\n2. Patient Service is running (port 5502)\n3. MongoDB is running';
        } else if (error.message) {
          errorMsg = error.message;
        }
        
        showMessage(errorMsg, 'error');
      }
    });
  }

  // Attach listener for the registration form
  const regForm = document.getElementById('regForm');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get form elements
      const usernameField = document.getElementById('username');
      const emailField = document.getElementById('email');
      const passwordField = document.getElementById('password');
      const phoneField = document.getElementById('phone');
      const dobField = document.getElementById('dob');
      const genderField = document.getElementById('gender');
      
      // Validate that all required fields are filled
      if (!usernameField || !emailField || !passwordField || !phoneField || !dobField || !genderField) {
        showMessage('Error: Form fields not found. Please refresh the page.', 'error');
        return;
      }
      
      const formData = {
        username: usernameField.value.trim(),
        email: emailField.value.trim(),
        password: passwordField.value,
        phone: phoneField.value.trim(),
        dob: dobField.value,
        gender: genderField.value,
      };

      // Validate form data before submitting
      if (!formData.username || !formData.email || !formData.password || !formData.phone || !formData.dob || !formData.gender) {
        showMessage('Please fill all required fields.', 'error');
        return;
      }

      try {
        const apiUrl = `${API_BASE_URL}/auth/register`;
        console.log('Attempting registration to:', apiUrl);
        console.log('Request body:', { ...formData, password: '***' });
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        
        console.log('Registration response status:', response.status);
        
        // Check if we got a response at all
        if (!response) {
          showMessage('Cannot connect to server. Please ensure the API Gateway is running on port 5501.', 'error');
          return;
        }
        
        let data;
        try {
          const text = await response.text();
          console.log('Registration response text:', text);
          if (!text) {
            showMessage('Empty response from server. Please check if Patient Service is running.', 'error');
            return;
          }
          data = JSON.parse(text);
          console.log('Registration response data:', { ...data, token: data.token ? '***' : undefined });
        } catch (jsonError) {
          // If response is not JSON, show a generic error
          console.error('JSON parse error:', jsonError);
          showMessage(`Server error. Status: ${response.status}. Response might not be JSON. Please check if services are running.`, 'error');
          return;
        }
        
        if (!response.ok) {
          // Handle HTTP error status codes (400, 409, 500, etc.)
          const errorMsg = data?.message || `Registration failed. Server returned status ${response.status}.`;
          console.error('Registration failed:', errorMsg);
          showMessage(errorMsg, 'error');
          return;
        }
        
        if (data.success) {
          console.log('Registration successful!');
          saveAuthData(data.token, data.user);
          showMessage('Registration successful! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 500);
        } else {
          const errorMsg = data?.message || 'Registration failed.';
          console.error('Registration failed:', errorMsg);
          showMessage(errorMsg, 'error');
        }
      } catch (error) {
        console.error('Registration error:', error);
        let errorMsg = 'An error occurred during registration.';
        
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
          errorMsg = 'Cannot connect to server. Please ensure:\n1. API Gateway is running (port 5501)\n2. Patient Service is running (port 5502)\n3. MongoDB is running';
        } else if (error.message) {
          errorMsg = error.message;
        }
        
        showMessage(errorMsg, 'error');
      }
    });
  }
});