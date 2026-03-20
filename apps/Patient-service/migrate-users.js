
import mongoose from 'mongoose';

const sourceUri = 'mongodb://127.0.0.1:27017/dr_nearby';
const targetUri = 'mongodb://127.0.0.1:27017/drnearby';

async function migrateUsers() {
  let sourceConn, targetConn;
  try {
    console.log('Connecting to databases...');
    sourceConn = await mongoose.createConnection(sourceUri).asPromise();
    targetConn = await mongoose.createConnection(targetUri).asPromise();
    console.log('Connected!');

    // Define minimal schema for copying
    const userSchema = new mongoose.Schema({}, { strict: false });
    const SourceUser = sourceConn.model('User', userSchema, 'users');
    const TargetUser = targetConn.model('User', userSchema, 'users');

    const usersToMigrate = await SourceUser.find({});
    console.log(`Found ${usersToMigrate.length} users in source DB.`);

    let migrated = 0;
    let skipped = 0;

    for (const user of usersToMigrate) {
      try {
        // Check if user with same email exists in target
        const existing = await TargetUser.findOne({ email: user.get('email') });
        if (existing) {
          console.log(`Skipping user ${user.get('email')} (already exists)`);
          skipped++;
          continue;
        }

        // Insert into target
        // We use toObject() to get plain data, and delete _id if we want new IDs, 
        // BUT user might want to preserve IDs if referenced elsewhere.
        // Since there are no references in target (it's a new DB essentially), preserving ID is fine 
        // unless it collides. 
        // Let's try to preserve _id.
        const userData = user.toObject();
        await TargetUser.create(userData);
        console.log(`Migrated user: ${user.get('email')}`);
        migrated++;
      } catch (err) {
        if (err.code === 11000) {
           console.log(`Skipping user ${user.get('email')} (duplicate key error)`);
           skipped++;
        } else {
           console.error(`Failed to migrate user ${user.get('email')}:`, err.message);
        }
      }
    }

    console.log(`\nMigration complete.`);
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped: ${skipped}`);

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    if (sourceConn) await sourceConn.close();
    if (targetConn) await targetConn.close();
  }
}

migrateUsers();
