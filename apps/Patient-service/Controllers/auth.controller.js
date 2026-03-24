// apps/Patient-service/controllers/auth.controller.js

/**
 * @description Register a new patient
 * @route POST /register
 */
export const register = (req, res) => {
  console.log('Patient Service: Registration attempt for:', req.body.email);
  const { username, email } = req.body;
  
  const mockUser = { id: 'user123', username, email };
  const mockToken = 'mock-jwt-token-for-registration';
  res.status(201).json({ success: true, user: mockUser, token: mockToken });
};

/**
 * @description Log in a patient
 * @route POST /login
 */
export const login = (req, res) => {
  res.json({ success: true, token: 'mock-jwt-token-for-login' });
};

/**
 * @description Get a patient's profile
 * @route GET /profile
 */
export const getProfile = (req, res) => {
  res.json({ success: true, profile: { id: 'user123', name: 'Raj Pujari' } });
};