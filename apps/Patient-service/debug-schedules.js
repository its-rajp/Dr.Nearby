
import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:27017/dr_nearby';

async function checkSchedules() {
  try {
    console.log(`Connecting to ${uri}...`);
    await mongoose.connect(uri);
    
    const count = await mongoose.connection.db.collection('doctor_schedules').countDocuments();
    console.log(`doctor_schedules count: ${count}`);
    
    if (count > 0) {
      const sample = await mongoose.connection.db.collection('doctor_schedules').findOne();
      console.log('Sample schedule:', sample);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkSchedules();
