import mongoose from 'mongoose';
import Appointment from '../models/appointment.js';
import Consultation from '../models/consultation.js';
import Notification from '../models/Notification.js';
import LabTest from '../models/Labtest.js';
import Prescription from '../models/prescription.js';
import LabBooking from '../models/LabBooking.js';
import HealthRecord from '../models/HealthRecord.js';

export const bookAppointment = async (req, res) => {
  try {
    console.log('Booking Request Body:', JSON.stringify(req.body, null, 2));
    const { patientId, doctorId, date, time, reason, consultationFee } = req.body;
    
    if (!patientId || !doctorId || !date || !time) {
      console.log('Missing fields:', { patientId, doctorId, date, time });
      return res.status(400).json({ success: false, message: 'Missing required fields: patientId, doctorId, date, time' });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      console.log('Invalid Patient ID:', patientId);
      return res.status(400).json({ success: false, message: `Invalid Patient ID format: ${patientId}` });
    }
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      console.log('Invalid Doctor ID:', doctorId);
      return res.status(400).json({ success: false, message: `Invalid Doctor ID format: ${doctorId}` });
    }
    
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: new Date(date),
      time,
      reason: reason || '',
      status: 'pending_approval',
      paymentStatus: 'paid',
      consultationFee: consultationFee || 500
    });
    
    await appointment.populate('patientId', 'username email phone profileImage');
    await appointment.populate('doctorId', 'name specialization hospital location');
    
    res.status(201).json({ success: true, appointment, message: 'Appointment booked and paid successfully! Pending doctor approval.' });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ success: false, message: error.message || 'Booking failed. Please try again.' });
  }
};

export const approveAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: 'confirmed' }, // Changed from 'approved' to 'confirmed'
      { new: true }
    ).populate('patientId doctorId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Automatically create the consultation record if it doesn't exist
    let consultation = await Consultation.findOne({ appointmentId: appointment._id });
    if (!consultation) {
        consultation = await Consultation.create({
            userId: appointment.patientId._id,
            doctorId: appointment.doctorId._id,
            appointmentId: appointment._id,
            date: appointment.date,
            timeSlot: appointment.time,
            symptoms: appointment.reason,
            status: 'in_progress', 
            meetLink: 'webrtc' 
        });
    } else {
        consultation.status = 'in_progress';
        consultation.meetLink = 'webrtc';
        await consultation.save();
    }

    // Notify Patient
    await Notification.create({
      userId: appointment.patientId._id,
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${appointment.doctorId.name} has been confirmed. Please proceed to the consultations page to join.`,
      type: 'appointment'
    });

    res.json({ success: true, appointment, consultation, message: 'Appointment confirmed and consultation created.' });
  } catch (error) {
    console.error('Error approving appointment:', error);
    res.status(500).json({ success: false, message: 'Error approving appointment' });
  }
};

// Appointment Management Functions
export const completeConsultation = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) return res.status(400).json({ success: false, message: 'Appointment ID required' });

    // Update Appointment
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: 'completed', paymentStatus: 'settled' },
      { new: true }
    );
    
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // Update Consultation if exists
    await Consultation.findOneAndUpdate(
        { appointmentId: appointmentId },
        { status: 'completed' }
    );

    res.json({ success: true, appointment, message: 'Consultation marked as completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate('patientId', 'username email profileImage')
            .populate('doctorId', 'name specialization')
            .sort({ date: -1 });
        res.json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDoctorAppointments = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const appointments = await Appointment.find({ doctorId })
            .populate('patientId', 'username email profileImage')
            .sort({ date: 1 });
        res.json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPatientAppointments = async (req, res) => {
    try {
        const { patientId } = req.params;
        const appointments = await Appointment.find({ patientId })
            .populate('doctorId', 'name specialization')
            .sort({ date: -1 });
        res.json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
        res.json({ success: true, appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const rejectAppointment = async (req, res) => {
  try {
    const { appointmentId, reason } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );
    res.json({ success: true, appointment, message: 'Appointment rejected. Flagged for admin/refund.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// Inferred Functions
export const requestConsultation = async (req, res) => {
  try {
    console.log('Request Consultation Body:', JSON.stringify(req.body, null, 2));
    const { userId, doctorId, date, timeSlot, symptoms, paymentStatus, amount } = req.body;

    // Security check: Only allow consultation requests that have been paid
    if (paymentStatus !== 'paid') {
      return res.status(403).json({ 
        success: false, 
        message: 'Consultation request denied. Please complete the ₹500 payment first.' 
      });
    }

    // 1. Create Appointment first (so it shows in doctor's appointments)
    const appointment = await (await Appointment.create({
      patientId: userId,
      doctorId: doctorId,
      date: date,
      time: timeSlot,
      reason: symptoms,
      status: 'pending',
      consultationFee: amount || 500, // Fixed 500 Rs fee or from request
      paymentStatus: paymentStatus || 'pending'
    })).populate('patientId');

    // 2. Create Consultation record linked to the appointment
    const consultation = await Consultation.create({
      userId, 
      doctorId, 
      appointmentId: appointment._id,
      date, 
      timeSlot, 
      symptoms, 
      status: 'pending'
    });

    await Notification.create({ 
      userId: doctorId, 
      title: 'New Prepaid Consultation Request', 
      message: `You have a new PAID consultation request from ${appointment.patientId.username || 'Patient'} (Fee: ₹500 received).`, 
      type: 'consultation' 
    });

    res.status(201).json({ success: true, consultation, appointment });
  } catch (error) { 
    console.error('Request Consultation Error:', error);
    res.status(500).json({ success: false, message: error.message }); 
  }
};

export const getConsultations = async (req, res) => {
  try {
    const { userId, doctorId } = req.query;
    const query = {};
    if (userId) query.userId = userId;
    if (doctorId) query.doctorId = doctorId;
    const consultations = await Consultation.find(query)
      .populate('userId', 'username email')
      .populate('doctorId', 'name specialization')
      .sort({ date: -1 });
    res.json({ success: true, consultations });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('doctorId', 'name specialization');
    if (!consultation) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, consultation });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, consultation });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const startConsultation = async (req, res) => {
  try {
    const id = req.body.consultationId || req.body.id;
    const consultation = await Consultation.findByIdAndUpdate(id, { status: 'in_progress' }, { new: true });
    res.json({ success: true, consultation });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const joinConsultation = async (req, res) => {
  try {
    const { consultationId, role } = req.body;
    // Support both id (legacy/generic) and consultationId (frontend)
    const id = consultationId || req.body.id;

    if (!id) return res.status(400).json({ success: false, message: 'Consultation ID is required' });

    const consultation = await Consultation.findById(id);
    if (!consultation) return res.status(404).json({ success: false, message: 'Not found' });

    // Update joined status based on role
    if (role === 'doctor') {
        // Increment count (handle undefined/null by treating existing true as 1, false as 0)
        let currentCount = consultation.doctorJoinCount || (consultation.doctorHasJoined ? 1 : 0);
        consultation.doctorJoinCount = currentCount + 1;
        // Block only if count reaches 2
        consultation.doctorHasJoined = consultation.doctorJoinCount >= 2;
    } else {
        // Increment count
        let currentCount = consultation.patientJoinCount || (consultation.patientHasJoined ? 1 : 0);
        consultation.patientJoinCount = currentCount + 1;
        // Block only if count reaches 2
        consultation.patientHasJoined = consultation.patientJoinCount >= 2;
    }
    await consultation.save();

    res.json({ success: true, meetLink: consultation.meetLink });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.query;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// Functions from 500-600 block
export const setMeetingLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { meetLink } = req.body;

    if (!meetLink) {
        return res.status(400).json({ success: false, message: 'Meeting link is required' });
    }

    let consultation = await Consultation.findByIdAndUpdate(
      id,
      { meetLink, status: 'active' }, 
      { new: true }
    );

    if (!consultation) {
      const appointment = await Appointment.findById(id);
      if (appointment) {
         appointment.status = 'scheduled'; 
         await appointment.save();

         consultation = await Consultation.create({
           userId: appointment.patientId,
           doctorId: appointment.doctorId,
           appointmentId: appointment._id,
           date: appointment.date,
           timeSlot: appointment.time,
           symptoms: appointment.reason,
           status: 'active',
           meetLink: meetLink
         });
      } else {
         return res.status(404).json({ success: false, message: 'Consultation/Appointment not found' });
      }
    } else {
        if (consultation.appointmentId) {
            await Appointment.findByIdAndUpdate(consultation.appointmentId, { status: 'scheduled' });
        }
    }

    await Notification.create([
        {
            userId: consultation.userId,
            title: 'Consultation Link Ready',
            message: 'Your consultation meeting link is ready. Please join via the Consult Online page.',
            type: 'consultation'
        },
        {
            userId: consultation.doctorId,
            title: 'Consultation Link Ready',
            message: 'Meeting link set for consultation. Please start the session from the Communication page.',
            type: 'consultation'
        }
    ]);

    res.json({ success: true, consultation, message: 'Meeting link set and notifications sent.' });

  } catch (error) {
      console.error('Error setting meeting link:', error);
      res.status(500).json({ success: false, message: 'Failed to set meeting link' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });
    const result = await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: `${result.modifiedCount} notifications marked as read` });
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
};

// Functions from 680+ block
export const createPrescription = async (req, res) => {
  try {
    const { patientId, doctorId, date, diagnosis, medicines, instructions } = req.body;
    
    if (!patientId || !doctorId || !diagnosis || !medicines || medicines.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields: patientId, doctorId, diagnosis, medicines' });
    }
    
    const prescription = await Prescription.create({
      patientId,
      doctorId,
      date: date ? new Date(date) : new Date(),
      diagnosis,
      medicines,
      instructions: instructions || ''
    });
    
    await prescription.populate('patientId', 'username email phone');
    await prescription.populate('doctorId', 'name specialization hospital location');
    
    res.status(201).json({ success: true, prescription, message: 'Prescription created successfully!' });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create prescription' });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const { doctorId, patientId } = req.query;
    let query = {};
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;
    
    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'username email phone')
      .populate('doctorId', 'name specialization hospital location')
      .sort({ date: -1 });
    
    res.json({ success: true, prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prescriptions' });
  }
};

// Lab Test Functions
export const getLabTests = async (req, res) => {
  try {
    const tests = await LabTest.find();
    res.json({ success: true, tests });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const processLabBookingPayment = async (req, res) => {
  try {
    const { userId, labTestId, testName, patientName, age, gender, date, time, address, amount, paymentMethod } = req.body;
    const booking = await LabBooking.create({
      userId, labTestId, testName, patientName, age, gender, date,
      time: time || '09:00 AM', homeCollection: !!address, address,
      amount, paymentMethod, transactionId: 'TXN' + Math.floor(100000 + Math.random() * 900000),
      paymentDate: new Date(), status: 'confirmed'
    });
    res.status(201).json({ success: true, booking, transactionId: booking.transactionId });
  } catch (error) {
    console.error('Error processing lab booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLabBookings = async (req, res) => {
  try {
    const bookings = await LabBooking.find().sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getLabBookingById = async (req, res) => {
  try {
    const booking = await LabBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// Health Records
export const createHealthRecord = async (req, res) => {
  try {
    const { userId, title, description, fileUrl, type, doctorId } = req.body;
    
    if (!userId || !title) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const record = await HealthRecord.create({
      userId,
      doctorId,
      title,
      description,
      fileUrl,
      type
    });
    
    res.status(201).json({ success: true, record });
  } catch (error) {
    console.error('Error creating health record:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHealthRecords = async (req, res) => {
  try {
    const { userId, doctorId, isAdmin } = req.query;
    let query = {};
    
    if (userId) query.userId = userId;
    if (doctorId) query.doctorId = doctorId;
    if (isAdmin === 'true') query = {}; 

    const records = await HealthRecord.find(query)
      .populate('userId', 'username email')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, records });
  } catch (error) {
    console.error('Error fetching health records:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
