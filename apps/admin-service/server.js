// apps/admin-service/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from '../Shared/Config/db.js';
import adminRoutes from './routes/admin.routes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.ADMIN_SERVICE_PORT || 5504;

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());


app.use('/admin', adminRoutes);


connectDB(undefined, mongoose).then((connected) => {
  if (!connected) {
    console.warn('⚠️  Starting Admin Service without MongoDB connection. Some features may not work.');
  }
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🛡️  Admin Service running on http://localhost:${PORT}`);
    if (!connected) {
      console.warn('⚠️  WARNING: MongoDB not connected. Database operations will fail.');
    }
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please stop the existing server.`);
      process.exit(1);
    }
  });
}).catch((error) => {
  console.error('❌ Failed to start Admin Service:', error.message);
  process.exit(1);
});