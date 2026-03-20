// apps/patient-service/controllers/auth.controller.js
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'dr_nearby_jwt_secret_v2_2025', {
    expiresIn: '7d'
  });
};

export const register = async (req, res) => {
  try {
    const { username, email, password, phone, dob, gender } = req.body;
    const user = await User.create({ username, email, password, phone, dob: new Date(dob), gender });
    const token = generateToken(user._id);
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
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email or username already exists.' });
    }
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: login }, { username: login }]
    });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const getProfile = async (req, res) => {
  // In real version: verify JWT from req.headers.authorization
  const user = await User.findById(req.query.userId); // Simplified for demo
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
};