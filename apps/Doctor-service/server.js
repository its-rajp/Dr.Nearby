// apps/Doctor-service/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import doctorRoutes from './routes/doctor.routes.js';

// Determine __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drnearby';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Doctor Service: Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

const app = express();
const PORT = process.env.DOCTOR_SERVICE_PORT || 5503;

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // Allow any origin for development
  },
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[Doctor-Service] ${req.method} ${req.originalUrl}`);
  next();
});

// The gateway strips /api/doctor to /doctor, so we mount at /doctor
app.use('/doctor', doctorRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Doctor-Service' });
});

// 404 handler
app.use((req, res) => {
  console.log(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Doctor Service Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`👨‍⚕️ Doctor Service running on http://localhost:${PORT}`);
});