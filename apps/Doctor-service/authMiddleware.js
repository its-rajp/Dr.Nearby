import jwt from 'jsonwebtoken';
import Doctor from './models/doctor.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dr_nearby_jwt_secret_v2_2025');
      
      // Allow Admin and Super Admin
      if (decoded.role === 'admin' || decoded.role === 'super_admin') {
        req.user = { _id: decoded.id, role: decoded.role };
        return next();
      }

      req.user = await Doctor.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Doctor not found' });
      }
      // Add user ID to req for easy access
      req.user.id = req.user._id;
      next();
    } catch (error) {
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};
