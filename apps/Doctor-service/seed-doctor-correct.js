import mongoose from 'mongoose';
import Doctor from './models/doctor.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    // Use the exact same URI as server.js
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drnearby';
    console.log(`Connecting to: ${uri}`);
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const checkDoctors = async () => {
  await connectDB();
  
  const doctors = await Doctor.find({});
  console.log(`Found ${doctors.length} doctors in 'drnearby' database.`);
  
  const targetEmail = 'doctor@example.com';
  const existingTarget = doctors.find(d => d.email === targetEmail);

  if (!existingTarget) {
    console.log(`Creating default doctor ${targetEmail}...`);
    
    const doctor = await Doctor.create({
      name: 'Dr. John Smith',
      email: targetEmail,
      password: 'password123', 
      phone: '1234567890',
      dob: new Date('1980-01-01'),
      gender: 'male',
      specialization: 'Cardiologist',
      hospital: 'General Hospital',
      location: {
        address: '123 Main St',
        city: 'Metropolis',
        state: 'NY',
        zipCode: '10001'
      },
      licenseNumber: 'DOC123456',
      experience: 10,
      qualification: 'MBBS, MD'
    });
    console.log('Default doctor created:');
    console.log(`Email: ${targetEmail}`);
    console.log('Password: password123');
  } else {
    console.log(`Doctor ${targetEmail} already exists.`);
    const isMatch = await bcrypt.compare('password123', existingTarget.password);
    console.log(`Password 'password123' match for ${targetEmail}: ${isMatch}`);
    
    if (!isMatch) {
        console.log('Updating password to password123...');
        existingTarget.password = 'password123'; // Will be hashed by pre-save
        await existingTarget.save();
        console.log('Password updated.');
    }
  }
  
  process.exit();
};

checkDoctors();
