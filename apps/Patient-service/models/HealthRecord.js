import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['prescription', 'lab_report', 'x_ray', 'other'],
  },
  notes: {
    type: String,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }]
}, { timestamps: { createdAt: 'uploadedAt' } });

const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);

export default HealthRecord;