import mongoose from 'mongoose';

const labBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  labTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTest',
    required: true,
  },
  testName: { type: String, required: true },
  patientName: { type: String, required: true },
  age: { type: Number },
  gender: { type: String },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  homeCollection: { type: Boolean, default: false },
  address: { type: String }, 
  amount: { type: Number, required: true },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
  },
  paymentMethod: { type: String },
  transactionId: { type: String },
  paymentDate: { type: Date },
}, { timestamps: true });

const LabBooking = mongoose.model('LabBooking', labBookingSchema);

export default LabBooking;
