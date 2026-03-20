
import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:27017/drnearby';

async function verifyMigration() {
  try {
    await mongoose.connect(uri);
    const count = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`Users in drnearby: ${count}`);
    const users = await mongoose.connection.db.collection('users').find().toArray();
    console.table(users.map(u => ({ email: u.email, id: u._id })));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

verifyMigration();
