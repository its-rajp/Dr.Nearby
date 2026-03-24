import { Router } from 'express';
import { bookAppointment, approveAppointment, rejectAppointment, completeConsultation, getAppointments, getDoctorAppointments, getPatientAppointments, updateAppointmentStatus } from '../controllers/consultationcontroller.js';

const router = Router();
router.post('/', bookAppointment); // POST /appointments
router.post('/bookings', bookAppointment); 
router.post('/approve', approveAppointment); 
router.post('/reject', rejectAppointment); 
router.post('/complete', completeConsultation); 
router.get('/', getAppointments);
router.get('/doctor/:doctorId', getDoctorAppointments);
router.get('/patient/:patientId', getPatientAppointments);
router.put('/:id', updateAppointmentStatus);
export default router;