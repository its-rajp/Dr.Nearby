
import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:27017/dr_nearby';

async function scanOldDatabase() {
  try {
    console.log(`Connecting to ${uri}...`);
    await mongoose.connect(uri);
    console.log('Connected to OLD DB!');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.table(collections.map(c => ({ name: c.name, type: c.type })));

    for (const col of collections) {
      if (['users', 'doctors', 'patients'].includes(col.name)) {
        const count = await mongoose.connection.db.collection(col.name).countDocuments();
        console.log(`\nCollection: ${col.name} (Count: ${count})`);
        
        if (count > 0) {
          const samples = await mongoose.connection.db.collection(col.name).find().limit(3).toArray();
          console.log('Sample documents:');
          samples.forEach(doc => {
            const printable = { ...doc };
            if (printable.password) printable.password = printable.password.substring(0, 15) + '...';
            console.log(JSON.stringify(printable, null, 2));
          });
        }
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected.');
  }
}

scanOldDatabase();
