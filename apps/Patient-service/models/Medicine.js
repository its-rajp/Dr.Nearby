import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  image: { type: String }
}, { timestamps: true });

export default mongoose.model('Medicine', medicineSchema);
