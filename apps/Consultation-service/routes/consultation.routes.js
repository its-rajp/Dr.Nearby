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




router.get('/notifications', getNotifications);
router.put('/notifications/mark-all-read', markAllNotificationsAsRead); 
router.put('/notifications/:id', markNotificationAsRead);


router.post('/prescriptions', createPrescription);
router.get('/prescriptions', getPrescriptions);


router.get('/lab-tests', getLabTests);
router.post('/lab-tests/book', processLabBookingPayment); 
router.get('/lab-tests/bookings', getLabBookings); 
router.get('/lab-tests/bookings/:id', getLabBookingById); 


router.post('/health-records', createHealthRecord);
router.get('/health-records', getHealthRecords);


router.post('/request', requestConsultation);
router.post('/start', startConsultation);
router.post('/join', joinConsultation);
router.get('/', getConsultations);



router.get('/:id', getConsultationById);
router.put('/:id', updateConsultation);
router.put('/:id/link', setMeetingLink);

export default router;
