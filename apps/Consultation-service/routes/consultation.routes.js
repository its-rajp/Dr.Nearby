import { Router } from 'express';
import { 
  requestConsultation, 
  startConsultation, 
  getNotifications, 
  getConsultations, 
  getConsultationById, 
  updateConsultation, 
  setMeetingLink, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  createPrescription, 
  getPrescriptions, 
  joinConsultation,
  getLabTests,
  processLabBookingPayment,
  getLabBookings,
  getLabBookingById,
  createHealthRecord,
  getHealthRecords
} from '../controllers/consultationcontroller.js';

const router = Router();

// --- Specific Routes MUST come before Parameterized Routes ---

// Notification Routes
router.get('/notifications', getNotifications);
router.put('/notifications/mark-all-read', markAllNotificationsAsRead); // Specific PUT before generic :id
router.put('/notifications/:id', markNotificationAsRead);

// Prescription Routes
router.post('/prescriptions', createPrescription);
router.get('/prescriptions', getPrescriptions);

// Lab Test Routes
router.get('/lab-tests', getLabTests);
router.post('/lab-tests/book', processLabBookingPayment); // Handles payment + booking
router.get('/lab-tests/bookings', getLabBookings); // For Admin
router.get('/lab-tests/bookings/:id', getLabBookingById); // For Confirmation Page

// Health Records
router.post('/health-records', createHealthRecord);
router.get('/health-records', getHealthRecords);

// Consultation Routes (Specific)
router.post('/request', requestConsultation);
router.post('/start', startConsultation);
router.post('/join', joinConsultation);
router.get('/', getConsultations);

// Consultation Routes (Parameterized - catch all :id)
// These must be LAST because they match anything like /abc
router.get('/:id', getConsultationById);
router.put('/:id', updateConsultation);
router.put('/:id/link', setMeetingLink);

export default router;
