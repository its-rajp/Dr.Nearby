import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Doctor from '../models/doctor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drnearby';

async function setPassword(email, newPassword) {
  await mongoose.connect(MONGODB_URI);
  const hash = await bcrypt.hash(newPassword, 10);
  const result = await Doctor.updateOne({ email }, { $set: { password: hash } });
  if (result.matchedCount === 0) {
    console.log(`Doctor not found: ${email}`);
  } else {
    console.log(`Password updated for ${email}`);
  }
  await mongoose.disconnect();
}

const targets = [
  { email: 'testdoc@example.com', password: 'password123' },
  { email: 'rajkumargodhke13@gmail.com', password: 'password123' }
];

for (const t of targets) {
  await setPassword(t.email, t.password);
}


async function updateDoctorProfile() {
  await mongoose.connect(MONGODB_URI);
  
  let filter = { email: 'rajkumargodhke13@gmail.com' };
  let doc = await Doctor.findOne(filter);
  
  
  if (!doc) {
      filter = { email: 'rajkumargodke@gmai.com' };
  }

  const update = {
    $set: {
      email: 'rajkumargodhke13@gmail.com',
      specialization: 'Urology',
      hospital: 'Uroclinic',
      location: {
        address: 'Lohgaon',
        city: 'Pune',
        state: 'Maharashtra',
        zipCode: ''
      }
    }
  };
  const result = await Doctor.updateOne(filter, update);
  if (result.matchedCount === 0) {
    console.log('Doctor to update not found for email rajkumargodke@gmai.com');
  } else {
    console.log('Doctor profile updated: email, specialization, hospital, location');
  }
  await mongoose.disconnect();
}

await updateDoctorProfile();

console.log('Done.');
