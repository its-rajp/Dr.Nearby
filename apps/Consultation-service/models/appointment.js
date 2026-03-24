import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'pending_approval', 'approved', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled', 'rejected'], 
    default: 'pending' 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'settled'],
    default: 'pending'
  },
  consultationFee: { type: Number, default: 0 },
  reason: { type: String, default: '' },
  meetLink: { type: String, default: '' },
  rejectionReason: { type: String, default: '' },
  adminNotes: { type: String, default: '' },
  doctorNotes: { type: String, default: '' }
}, { timestamps: true });


appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });

export default mongoose.model('Appointment', appointmentSchema);
