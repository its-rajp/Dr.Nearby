import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }, 
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String }, // URL to file (mock or actual)
  type: { type: String, enum: ['Report', 'Prescription', 'X-Ray', 'Other'], default: 'Other' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('HealthRecord', healthRecordSchema);
