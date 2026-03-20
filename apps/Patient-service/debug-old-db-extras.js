
import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:27017/dr_nearby';

async function scanOldDatabaseExtras() {
  try {
    console.log(`Connecting to ${uri}...`);
    await mongoose.connect(uri);
    
    const collections = ['doctor_auth', 'admin_users'];
    
    for (const name of collections) {
      const count = await mongoose.connection.db.collection(name).countDocuments();
      console.log(`\nCollection: ${name} (Count: ${count})`);
      
      if (count > 0) {
        const samples = await mongoose.connection.db.collection(name).find().limit(3).toArray();
        samples.forEach(doc => {
          const printable = { ...doc };
          if (printable.password) printable.password = printable.password.substring(0, 15) + '...';
          console.log(JSON.stringify(printable, null, 2));
        });
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

scanOldDatabaseExtras();
