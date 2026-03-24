// apps/consultation-service/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import appointmentRoutes from './routes/appointment.routes.js';
import consultationRoutes from './routes/consultation.routes.js';

import './models/User.js';
import './models/Doctor.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.resolve(__dirname, '../../.env') });


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drnearby';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Consultation Service: Connected to MongoDB'))
  .catch(err => {
    console.warn('⚠️ MongoDB connection failed:', err.message);
    console.warn('⚠️ Switching to IN-MEMORY (JavaScript) mode. Data will be lost on restart.');
  });


const app = express();
const PORT = process.env.CONSULTATION_SERVICE_PORT || 5505;


app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); 
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));


app.use((req, res, next) => {
  console.log(`[Consultation-Service] ${req.method} ${req.originalUrl}`);
  next();
});


const storage = multer.memoryStorage(); 
const upload = multer({ storage });


let labTests = [
  { id: '1', name: 'Complete Blood Count', price: 300, description: 'Full blood analysis' },
  { id: '2', name: 'Lipid Profile', price: 500, description: 'Cholesterol test' }
];
let notifications = [];





app.use('/appointments', appointmentRoutes);


app.use('/consultations', consultationRoutes);





// 1. Keep them here (inline)
// 2. Or update Gateway to rewrite /api/notifications -> /consultations/notifications
// 3. Or mount consultationRoutes at / (root)



// I will update Gateway to rewrite /api/notifications -> /consultations/notifications as well.


app.get('/health', (req, res) => {
  res.json({ 
    service: 'consultation-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`💬 Consultation Service running on http://localhost:${PORT}`);
});