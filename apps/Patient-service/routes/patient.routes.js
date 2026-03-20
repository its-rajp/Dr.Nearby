import express from 'express';
import { getPatientProfile, getPublicPatientProfile, updatePatientProfile, getMedicalHistory, updateMedicalHistory, resetPassword, adminUpdateUser } from '../controllers/patient.controller.js';
import { uploadHealthRecord, getHealthRecords, getMedicines, placeMedicineOrder, getOrderById, processMedicinePayment, getAllOrders, shareHealthRecord, uploadProfilePhoto } from '../controllers/patientControllers.js';
import { protect } from '../authMiddleware.js';

const router = express.Router();

export default (upload) => {
  console.log('[Patient-Routes] Initializing routes...');

  // Route: /patient/profile
  // Gateway rewrites /api/patients/profile -> /patient/profile
  router.get('/profile', protect, getPatientProfile);
  
  // Public/Admin profile view by ID
  router.get('/profile/:id', getPublicPatientProfile);

  // Handle profile update
  router.put('/profile', protect, updatePatientProfile);
  router.post('/profile/upload-photo', protect, upload.single('file'), uploadProfilePhoto);
  
  // Admin: Reset password
  router.put('/reset-password/:id', protect, resetPassword);

  // Admin: Update user (e.g. deactivate)
  router.put('/users/:id', protect, adminUpdateUser);

  // Health Records
  router.post('/health-records/upload', protect, upload.single('file'), uploadHealthRecord);
  router.get('/health-records', protect, getHealthRecords);
  router.post('/health-records/:id/share', protect, shareHealthRecord);

  // Medicines
  router.get('/medicines', getMedicines); // Public route

  // Admin: Get all medicine orders
  router.get('/orders/admin/all', protect, getAllOrders);

  // Medicine Orders
  router.post('/orders', protect, placeMedicineOrder);
  router.get('/orders/:id', protect, getOrderById);

  // Medicine Payments
  // Path matched: /patient/payments/medicines/process (after gateway rewrite)
  // Router mounted at /patient, so we match /payments/medicines/process
  router.post('/payments/medicines/process', protect, processMedicinePayment);

  // Medical History
  router.get('/medical-history', protect, getMedicalHistory);
  router.get('/medical-history/:userId', protect, getMedicalHistory); // For doctors/admins
  router.put('/medical-history', protect, updateMedicalHistory);

  // Admin route
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
