// apps/Doctor-service/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import doctorRoutes from './routes/doctor.routes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drnearby';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Doctor Service: Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

const app = express();
const PORT = process.env.DOCTOR_SERVICE_PORT || 5503;


if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}


app.use('/uploads', express.static('uploads'));

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); 
  },
  credentials: true
}));
app.use(express.json());


app.use((req, res, next) => {
  console.log(`[Doctor-Service] ${req.method} ${req.originalUrl}`);
  next();
});


app.use('/doctor', doctorRoutes);


app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Doctor-Service' });
});

// 404 handler
app.use((req, res) => {
  console.log(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});


app.use((err, req, res, next) => {
  console.error('Doctor Service Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`👨‍⚕️ Doctor Service running on http://localhost:${PORT}`);
});