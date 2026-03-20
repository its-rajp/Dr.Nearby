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

// Determine __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PATIENT_SERVICE_PORT || 5502;

// Ensure uploads directory exists to prevent multer errors
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer with disk storage to preserve file extensions
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

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Handle URL-encoded form data
app.use((req, res, next) => {
  console.log(`[Patient-Service] ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Routes
app.get('/health', (req, res) => res.status(200).json({ status: 'UP', service: 'Patient-Service' }));

// Mount Patient Routes (Profile, etc.)
if (typeof patientRoutes === 'function') {
  // Pass upload middleware, though we are using JSON for profile now.
  // It might be used for other routes inside patientRoutes later.
  app.use('/patient', patientRoutes(upload));
} else {
  console.error("❌ Error: patientRoutes is not a function. Check 'apps/Patient-service/routes/patient.routes.js'.");
}

if (authRoutes) {
  app.use('/', authRoutes); // Mount at the root to handle /login and /register
} else {
  console.error("❌ Error: authRoutes is undefined. Check 'apps/Patient-service/routes/auth.routes.js' for 'export default router'.");
}

// Handle 404s with JSON
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start server
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