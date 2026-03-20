
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Medicine from './models/Medicine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drnearby';

const medicines = [
  { name: 'Paracetamol', price: 20, description: 'Pain relief', quantity: 100 },
  { name: 'Amoxicillin', price: 75, description: 'Antibiotic', quantity: 50 },
  { name: 'Ibuprofen', price: 30, description: 'Anti-inflammatory', quantity: 80 },
  { name: 'Cetirizine', price: 25, description: 'Antihistamine', quantity: 60 },
  { name: 'Azithromycin', price: 120, description: 'Broad-spectrum antibiotic', quantity: 40 },
  { name: 'Metformin', price: 45, description: 'Type 2 diabetes medication', quantity: 150 },
  { name: 'Amlodipine', price: 55, description: 'Blood pressure medication', quantity: 90 },
  { name: 'Omeprazole', price: 65, description: 'Gerd and acid reflux relief', quantity: 70 }
];

async function seedMedicines() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    console.log('Clearing existing medicines...');
    await Medicine.deleteMany({});

    console.log('Seeding medicines...');
    await Medicine.insertMany(medicines);

    console.log('✅ Medicine seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding medicines:', error);
    process.exit(1);
  }
}

seedMedicines();
