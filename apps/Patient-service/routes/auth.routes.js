// apps/Patient-service/routes/auth.routes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { protect } from '../authMiddleware.js';

const router = express.Router();


const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone, dob, gender } = req.body;

    // 1. Input Validation
    if (!username || !email || !password || !phone || !dob || !gender) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields: username, email, password, phone, dob, gender.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // 2. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists.' });
    }

    // 3. Create user
    const user = await User.create({
      username,
      email,
      password,
      phone,
      dob,
      gender,
      role: 'patient' 
    });

    // 4. Generate Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dr_nearby_jwt_secret_v2_2025', { expiresIn: '30d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    if (error.code === 121) {
      console.error('MongoDB Validation Error Details:', JSON.stringify(error.errInfo, null, 2));
      return res.status(400).json({ success: false, message: 'Database validation failed. Please check your input.' });
    }
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    const { email, password } = req.body;

    // 1. Input Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 3. Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    user.lastLogin = new Date();
    await user.save();

    // 4. Generate Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dr_nearby_jwt_secret_v2_2025', { expiresIn: '30d' });

    res.status(200).json({
      success: true,
      token,
      user: { _id: user._id, id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

export default router;
