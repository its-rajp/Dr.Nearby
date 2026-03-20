import { Router } from 'express';
import { bookAppointment, approveAppointment, rejectAppointment, completeConsultation, getAppointments, getDoctorAppointments, getPatientAppointments, updateAppointmentStatus } from '../controllers/consultationcontroller.js';

const router = Router();
router.post('/', bookAppointment); // POST /appointments
router.post('/bookings', bookAppointment); 
router.post('/approve', approveAppointment); // Doctor approves
router.post('/reject', rejectAppointment); // Doctor rejects
router.post('/complete', completeConsultation); // Post-consultation
router.get('/', getAppointments);
router.get('/doctor/:doctorId', getDoctorAppointments);
router.get('/patient/:patientId', getPatientAppointments);
router.put('/:id', updateAppointmentStatus);
export default router;