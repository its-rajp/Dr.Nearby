

export const connectDB = async (uri, mongooseInstance) => {
  if (!mongooseInstance) {
    console.error('❌ mongoose instance is required. Please import mongoose in your service and pass it to connectDB.');
    return false;
  }
  
  const mongoose = mongooseInstance;
  const dbUri = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drnearby';
  
  try {
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('⚠️  Please ensure MongoDB is running and the connection string is correct.');
    console.error('⚠️  Connection string:', dbUri.replace(/\/\/.*@/, '//***:***@')); 
    console.error('⚠️  Service will continue but database operations will fail.');
    return false;
  }
};