import jwt from 'jsonwebtoken';
import User from './models/user.model.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dr_nearby_jwt_secret_v2_2025');
      
      
      if (decoded.role === 'doctor') {
        req.doctor = { _id: decoded.id };
        req.user = { _id: decoded.id, role: 'doctor' }; 
        return next();
      }

      
      if (decoded.role === 'admin' || decoded.role === 'super_admin') {
        req.user = { _id: decoded.id, role: 'admin' };
        return next();
      }

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      next();
    } catch (error) {
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};
