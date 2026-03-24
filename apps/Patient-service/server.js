// apps/patient-service/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from '../Shared/Config/db.js';

import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PATIENT_SERVICE_PORT || 5502;


if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });


app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use((req, res, next) => {
  console.log(`[Patient-Service] ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/uploads', express.static('uploads')); 


app.get('/health', (req, res) => res.status(200).json({ status: 'UP', service: 'Patient-Service' }));


if (typeof patientRoutes === 'function') {
  
  
  app.use('/patient', patientRoutes(upload));
} else {
  console.error("❌ Error: patientRoutes is not a function. Check 'apps/Patient-service/routes/patient.routes.js'.");
}

if (authRoutes) {
  app.use('/', authRoutes); 
} else {
  console.error("❌ Error: authRoutes is undefined. Check 'apps/Patient-service/routes/auth.routes.js' for 'export default router'.");
}


app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});


connectDB(undefined, mongoose).then((connected) => {
  if (!connected) {
    console.warn('⚠️  Starting Patient Service without MongoDB connection. Some features may not work.');
  }
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`👤 Patient Service running on http://0.0.0.0:${PORT}`);
    if (!connected) {
      console.warn('⚠️  WARNING: MongoDB not connected. Authentication and database operations will fail.');
    }
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please stop the existing server.`);
      process.exit(1);
    }
  });
}).catch((error) => {
  console.error('❌ Failed to start Patient Service:', error.message);
  process.exit(1);
});