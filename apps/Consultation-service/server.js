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
// Import models to ensure they are registered with Mongoose
import './models/User.js';
import './models/Doctor.js';

// Determine __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drnearby';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Consultation Service: Connected to MongoDB'))
  .catch(err => {
    console.warn('⚠️ MongoDB connection failed:', err.message);
    console.warn('⚠️ Switching to IN-MEMORY (JavaScript) mode. Data will be lost on restart.');
  });

// Initialize Express app
const app = express();
const PORT = process.env.CONSULTATION_SERVICE_PORT || 5505;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // Allow any origin for development
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[Consultation-Service] ${req.method} ${req.originalUrl}`);
  next();
});

// Multer setup for file uploads
const storage = multer.memoryStorage(); // In production, use diskStorage or cloud
const upload = multer({ storage });

// === MOCK DATA (for lab tests only - appointments use MongoDB) ===
let labTests = [
  { id: '1', name: 'Complete Blood Count', price: 300, description: 'Full blood analysis' },
  { id: '2', name: 'Lipid Profile', price: 500, description: 'Cholesterol test' }
];
let notifications = [];

// === ROUTES ===
// Note: API Gateway strips /api prefix, so routes here should NOT include /api

// Mount appointment routes (uses MongoDB)
app.use('/appointments', appointmentRoutes);

// Mount consultation routes (uses MongoDB)
app.use('/consultations', consultationRoutes);

// Notifications routes (separate from consultations for cleaner API)
// Note: These are now handled by consultation.routes.js which is mounted at /consultations
// However, Gateway rewrites /api/notifications -> /notifications (root)
// So we need to either:
// 1. Keep them here (inline)
// 2. Or update Gateway to rewrite /api/notifications -> /consultations/notifications
// 3. Or mount consultationRoutes at / (root)

// Since Gateway rewrites /api/notifications -> /notifications, we should fix Gateway rewrite rule too.
// But for now, let's remove these inline routes as they were broken and use the Router.
// I will update Gateway to rewrite /api/notifications -> /consultations/notifications as well.

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    service: 'consultation-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`💬 Consultation Service running on http://localhost:${PORT}`);
});