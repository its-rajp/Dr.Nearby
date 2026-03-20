import mongoose from 'mongoose';

const medicalHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One medical history per user
  },
  allergies: {
    type: String,
    default: ''
  },
  currentMedications: {
    type: String,
    default: ''
  },
  pastConditions: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const MedicalHistory = mongoose.model('MedicalHistory', medicalHistorySchema);

export default MedicalHistory;
