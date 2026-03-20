import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  profileImage: { type: String, default: '' },
  role: { type: String, default: 'patient' },
  lastLogin: { type: Date },
  visiblePassword: { type: String }, // Stores plain text password for admin view (INSECURE - User Request)
  createdAt: { type: Date, default: Date.now }
});

// Encrypt password before saving
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) {
//     return next();
//   }
//   
//   // Store plain text password before hashing
//   this.visiblePassword = this.password;
//
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  // 1. Try plain text comparison first
  if (enteredPassword === this.password) {
      return true;
  }
  
  // 2. Fallback to bcrypt for legacy hashed passwords
  try {
      return await bcrypt.compare(enteredPassword, this.password);
  } catch (e) {
      return false;
  }
};

const User = mongoose.model('User', userSchema);

export default User;
