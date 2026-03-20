import mongoose from 'mongoose';

const medicineOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  medicines: [{
    medicineId: String,
    name: String,
    quantity: Number,
    price: Number
  }],
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
  },
  paymentMethod: { type: String },
  transactionId: { type: String },
  amount: { type: Number },
  deliveryAddress: { type: String },
  upiId: { type: String },
  paymentDate: { type: Date },
  deliveryDate: { type: Date }
}, { timestamps: true });

const MedicineOrder = mongoose.model('MedicineOrder', medicineOrderSchema);

export default MedicineOrder;