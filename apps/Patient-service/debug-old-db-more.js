
import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:27017/dr_nearby';

async function scanOldDatabaseMore() {
  try {
    console.log(`Connecting to ${uri}...`);
    await mongoose.connect(uri);
    
    const collections = ['medicalhistories', 'appointments', 'consultations', 'medicineorders'];
    
    for (const name of collections) {
      const count = await mongoose.connection.db.collection(name).countDocuments();
      console.log(`\nCollection: ${name} (Count: ${count})`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

scanOldDatabaseMore();
