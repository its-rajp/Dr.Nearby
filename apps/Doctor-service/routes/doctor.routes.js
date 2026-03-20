// apps/Doctor-service/routes/doctor.routes.js
import { Router } from 'express';
import { getDoctorProfile, login, registerDoctor, updateDoctorProfile, resetPassword, adminUpdateDoctor } from '../controllers/doctor.controller.js';
import { protect } from '../authMiddleware.js';

const router = Router();

// Doctor authentication
router.post('/login', login);
router.post('/register', registerDoctor);
router.put('/reset-password/:id', protect, resetPassword);

// Admin: Update doctor (e.g. deactivate)
router.put('/doctors/:id', protect, adminUpdateDoctor);

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine upload path - go up to apps root then to uploads
    // Assuming we want to share uploads folder or keep it in service
    // For simplicity, let's use a local uploads folder and serve it, or use the Patient Service one via Gateway?
    // The Gateway proxies /uploads to Patient Service. 
    // So if we want to serve these images, we should probably save them where Patient Service can see them, 
    // OR add a route in Gateway to serve Doctor Service uploads too.
    // Given the "apps/Patient-service/uploads" pattern, let's try to save to a common location or handled by the service.
    
    // Better approach: Use the same uploads directory as Patient Service if possible, or a parallel one.
    // Let's create 'uploads' in Doctor-service and expose it via Gateway if needed.
    // BUT Gateway rule is: app.use('/uploads', createProxyMiddleware({ target: PATIENT_SERVICE ... }))
    // So we should save to Patient Service uploads? No, that's cross-service file write (bad).
    
    // Alternative: Save to Doctor Service 'uploads' and add a Gateway rule.
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `doctor-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

import { uploadDoctorProfilePhoto } from '../controllers/doctor.controller.js';
router.post('/doctors/upload-photo', protect, upload.single('file'), uploadDoctorProfilePhoto);

// Doctor profile routes
router.get('/profile', protect, getDoctorProfile); // Get own profile (protected)
router.get('/profile/:id', getDoctorProfile); // Public profile view by ID
router.put('/profile', protect, updateDoctorProfile); // Update own profile (protected)

// Get list of all doctors (for appointment booking)
router.get('/list', async (req, res) => {
  try {
    const Doctor = (await import('../models/doctor.js')).default;
    // Admin needs to see all details including password hash
    const doctors = await Doctor.find({ isActive: true });
    res.json({ success: true, doctors });
  } catch (error) {
    console.error('Error fetching doctors list:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
});

export default router;