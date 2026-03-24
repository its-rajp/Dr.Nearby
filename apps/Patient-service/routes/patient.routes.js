import express from 'express';
import { getPatientProfile, getPublicPatientProfile, updatePatientProfile, getMedicalHistory, updateMedicalHistory, resetPassword, adminUpdateUser } from '../controllers/patient.controller.js';
import { uploadHealthRecord, getHealthRecords, getMedicines, placeMedicineOrder, getOrderById, processMedicinePayment, getAllOrders, shareHealthRecord, uploadProfilePhoto } from '../controllers/patientControllers.js';
import { protect } from '../authMiddleware.js';

const router = express.Router();

export default (upload) => {
  console.log('[Patient-Routes] Initializing routes...');

  
  
  router.get('/profile', protect, getPatientProfile);
  
  
  router.get('/profile/:id', getPublicPatientProfile);

  
  router.put('/profile', protect, updatePatientProfile);
  router.post('/profile/upload-photo', protect, upload.single('file'), uploadProfilePhoto);
  
  
  router.put('/reset-password/:id', protect, resetPassword);

  
  router.put('/users/:id', protect, adminUpdateUser);

  
  router.post('/health-records/upload', protect, upload.single('file'), uploadHealthRecord);
  router.get('/health-records', protect, getHealthRecords);
  router.post('/health-records/:id/share', protect, shareHealthRecord);

  
  router.get('/medicines', getMedicines); 

  
  router.get('/orders/admin/all', protect, getAllOrders);

  
  router.post('/orders', protect, placeMedicineOrder);
  router.get('/orders/:id', protect, getOrderById);

  
  
  
  router.post('/payments/medicines/process', protect, processMedicinePayment);

  
  router.get('/medical-history', protect, getMedicalHistory);
  router.get('/medical-history/:userId', protect, getMedicalHistory); 
  router.put('/medical-history', protect, updateMedicalHistory);

  
  router.get('/users', async (req, res) => {
    try {
      const User = (await import('../models/user.model.js')).default;
      const users = await User.find({}); 
      res.json({ success: true, users });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  });

  return router;
};
