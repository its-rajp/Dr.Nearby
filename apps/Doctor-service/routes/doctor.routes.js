// apps/Doctor-service/routes/doctor.routes.js
import { Router } from 'express';
import { getDoctorProfile, login, registerDoctor, updateDoctorProfile, resetPassword, adminUpdateDoctor } from '../controllers/doctor.controller.js';
import { protect } from '../authMiddleware.js';

const router = Router();


router.post('/login', login);
router.post('/register', registerDoctor);
router.put('/reset-password/:id', protect, resetPassword);


router.put('/doctors/:id', protect, adminUpdateDoctor);

import multer from 'multer';
import path from 'path';
import fs from 'fs';


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    
    
    
    
    
    // OR add a route in Gateway to serve Doctor Service uploads too.
    
    
    
    
    // BUT Gateway rule is: app.use('/uploads', createProxyMiddleware({ target: PATIENT_SERVICE ... }))
    
    
    
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


router.get('/profile', protect, getDoctorProfile); 
router.get('/profile/:id', getDoctorProfile); 
router.put('/profile', protect, updateDoctorProfile); 


router.get('/list', async (req, res) => {
  try {
    const Doctor = (await import('../models/doctor.js')).default;
    
    const doctors = await Doctor.find({ isActive: true });
    res.json({ success: true, doctors });
  } catch (error) {
    console.error('Error fetching doctors list:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
});

export default router;