// dr.nearby-backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './Shared/Config/db.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import adminRoutes from './routes/admin.routes.js';
import patientRoutes from './routes/patient.routes.js';
import consultationRoutes from './routes/consultation.routes.js';

// Determine __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
connectDB();

const app = express();
const PORT = process.env.PORT || 5000; // Changed to 5000 to avoid conflict with API Gateway (5501)

app.use(cors({ origin: ['http://localhost:8000', 'http://127.0.0.1:8000'], credentials: true }));
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/consultations', consultationRoutes);

// Health check
app.get('/api', (req, res) => {
  res.json({ status: 'Dr.Nearby Backend Running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});