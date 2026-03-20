import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  symptoms: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'confirmed', 'active', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
  meetLink: { type: String, default: '' },
  patientHasJoined: { type: Boolean, default: false },
  doctorHasJoined: { type: Boolean, default: false },
  patientJoinCount: { type: Number, default: 0 },
  doctorJoinCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Consultation', consultationSchema);
