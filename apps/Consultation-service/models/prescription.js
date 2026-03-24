import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true, default: Date.now },
  diagnosis: { type: String, required: true },
  medicines: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true }
  }],
  instructions: { type: String, default: '' }
}, { timestamps: true });


prescriptionSchema.index({ doctorId: 1, date: -1 });
prescriptionSchema.index({ patientId: 1, date: -1 });

export default mongoose.model('Prescription', prescriptionSchema);
