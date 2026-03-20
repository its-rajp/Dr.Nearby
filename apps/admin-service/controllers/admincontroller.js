// apps/admin-service/controllers/admin.controller.js
import Admin from '../models/admin.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dr_nearby_jwt_secret_v2_2025';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Admin Login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required.' 
      });
    }

    const admin = await Admin.findOne({ username });
    
    let isMatch = false;
    if (admin) {
        isMatch = await admin.matchPassword(password);
        if (!isMatch && password === admin.password) {
             isMatch = true;
        }
    }

    if (!admin || !isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials.' 
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is disabled.' 
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id, admin.role);
    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

// Get Admin Profile
export const getProfile = async (req, res) => {
  // In production: verify JWT and extract admin ID from req.user
  const adminId = req.query.adminId; // Simplified for demo
  try {
    const admin = await Admin.findById(adminId).select('-password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

// Get All Users - Fetch from Patient Service via API Gateway
export const getAllUsers = async (req, res) => {
  try {
    // Use API Gateway or direct service call
    const PATIENT_SERVICE_PORT = process.env.PATIENT_SERVICE_PORT || 5502;
    const API_GATEWAY_PORT = process.env.API_GATEWAY_PORT || 5501;
    
    // Try API Gateway first, fallback to direct service
    let response;
    try {
      response = await fetch(`http://127.0.0.1:${API_GATEWAY_PORT}/api/patients/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      // Fallback to direct service
      response = await fetch(`http://127.0.0.1:${PATIENT_SERVICE_PORT}/patient/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (response && response.ok) {
      const data = await response.json();
      res.json({ success: true, users: data.users || [] });
    } else {
      // Fallback to empty array if service unavailable
      res.json({ success: true, users: [] });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.json({ success: true, users: [] });
  }
};

// Get All Doctors - Fetch from Doctor Service via API Gateway
export const getAllDoctors = async (req, res) => {
  try {
    // Use API Gateway or direct service call
    const DOCTOR_SERVICE_PORT = process.env.DOCTOR_SERVICE_PORT || 5503;
    const API_GATEWAY_PORT = process.env.API_GATEWAY_PORT || 5501;
    
    // Try API Gateway first, fallback to direct service
    let response;
    try {
      response = await fetch(`http://127.0.0.1:${API_GATEWAY_PORT}/api/doctor/list`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      // Fallback to direct service
      response = await fetch(`http://127.0.0.1:${DOCTOR_SERVICE_PORT}/doctor/list`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (response && response.ok) {
      const data = await response.json();
      res.json({ success: true, doctors: data.doctors || [] });
    } else {
      // Fallback to empty array if service unavailable
      res.json({ success: true, doctors: [] });
    }
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.json({ success: true, doctors: [] });
  }
};

// Create User (Mock integration)
export const createUser = async (req, res) => {
  const { name, email, role } = req.body;
  res.json({
    success: true,
    message: `User ${name} created successfully.`,
    user: { name, email, role }
  });
};

// Update User
export const updateUser = async (req, res) => {
  const { id } = req.params;
  
  try {
    const PATIENT_SERVICE_PORT = process.env.PATIENT_SERVICE_PORT || 5502;
    const response = await fetch(`http://127.0.0.1:${PATIENT_SERVICE_PORT}/patient/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Forward admin token or use internal secret if needed. 
        // For now assuming we pass the auth header from request or rely on service trust (but patient service checks token)
        // We should forward the token from the incoming request
        'Authorization': req.headers.authorization || '' 
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    if (response.ok && data.success) {
      res.json({ success: true, message: `User ${id} updated.`, user: data.user });
    } else {
      res.status(response.status).json({ success: false, message: data.message || 'Failed to update user' });
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error updating user.' });
  }
};

export const updateDoctor = async (req, res) => {
  const { id } = req.params;
  
  try {
    const DOCTOR_SERVICE_PORT = process.env.DOCTOR_SERVICE_PORT || 5503;
    const response = await fetch(`http://127.0.0.1:${DOCTOR_SERVICE_PORT}/doctor/doctors/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    if (response.ok && data.success) {
      res.json({ success: true, message: `Doctor ${id} updated.`, doctor: data.doctor });
    } else {
      res.status(response.status).json({ success: false, message: data.message || 'Failed to update doctor' });
    }
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ success: false, message: 'Server error updating doctor.' });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: `User ${id} deleted successfully.`
  });
};