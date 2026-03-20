import mongoose from 'mongoose';

const labTestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  availability: { type: Boolean, default: true }
});

export default mongoose.model('LabTest', labTestSchema);