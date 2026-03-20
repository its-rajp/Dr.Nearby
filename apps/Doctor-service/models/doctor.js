// models/Doctor.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  specialization: { type: String, required: true },
  hospital: { type: String, required: true },
  location: { 
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  licenseNumber: { type: String, required: true, unique: true },
  experience: { type: Number, required: true },
  qualification: { type: String, required: true },
  languages: [String],
  profileImage: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  visiblePassword: { type: String }, // Stores plain text password for admin view (INSECURE - User Request)
  consultationFee: { type: Number, default: 500 },
  availability: { type: String, default: 'Mon-Fri: 10:00 AM - 6:00 PM' },
  ratings: { type: String, default: '4.5/5' }
}, { timestamps: true });

// Hash password before saving
// doctorSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
  
//   // Store plain text password before hashing
//   this.visiblePassword = this.password;

//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

export default mongoose.model('Doctor', doctorSchema);
