import mongoose from 'mongoose';
import Doctor from './models/doctor.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/drnearby-doctor');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const checkDoctors = async () => {
  await connectDB();
  
  const doctors = await Doctor.find({});
  console.log(`Found ${doctors.length} doctors.`);
  
  if (doctors.length === 0 || (doctors.length === 1 && doctors[0].email === 'doctor@example.com')) {
    if (doctors.length > 0) {
        console.log('Removing existing test doctor to ensure correct password hashing...');
        await Doctor.deleteMany({ email: 'doctor@example.com' });
    }
    console.log('Creating a default doctor...');
    // const hashedPassword = await bcrypt.hash('password123', 10); // Don't hash manually if schema does it!
    
    // Check if schema has pre-save hook. Based on typical setup, it likely does.
    // To be safe, let's use a plain password. If the schema hashes it, good.
    // If the schema DOES NOT hash it, we might be storing plain text (bad, but works for login if login compares plain).
    // BUT we saw the schema DOES hash it.
    
    const doctor = await Doctor.create({
      name: 'Dr. John Smith',
      email: 'doctor@example.com',
      password: 'password123', // Pass plain text, let schema hash it
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
    console.log('Email: doctor@example.com');
    console.log('Password: password123');
  } else {
    doctors.forEach(d => {
      console.log(`- Name: ${d.name}, Email: ${d.email}, ID: ${d._id}`);
    });
    
    // Check specific credentials if needed
    // const isMatch = await bcrypt.compare('password123', doctors[0].password);
    // console.log(`Password 'password123' match for ${doctors[0].email}: ${isMatch}`);
  }
  
  process.exit();
};

checkDoctors();
