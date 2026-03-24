
import mongoose from 'mongoose';
import Admin from './models/admin.js';
import dotenv from 'dotenv';

dotenv.config();

const uri = 'mongodb://127.0.0.1:27017/drnearby';

async function setupAdmin() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const adminExists = await Admin.findOne({ username: 'admin' });
    
    if (adminExists) {
      console.log('Admin user already exists.');
      
      adminExists.password = 'admin123';
      await adminExists.save();
      console.log('Admin password reset to: admin123');
    } else {
      const newAdmin = new Admin({
        username: 'admin',
        password: 'admin123',
        email: 'admin@drnearby.com',
        fullName: 'System Administrator',
        role: 'super_admin'
      });
      await newAdmin.save();
      console.log('Admin user created successfully.');
    }

  } catch (error) {
    console.error('Error setup admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

setupAdmin();
