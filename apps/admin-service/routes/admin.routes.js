// apps/admin-service/routes/admin.routes.js
import { Router } from 'express';
import {
  login,
  getProfile,
  createUser,
  updateUser,
  updateDoctor,
  deleteUser,
  getAllUsers,
  getAllDoctors
} from '../controllers/admin.controller.js';

const router = Router();

// Public route
router.post('/login', login);

// Protected routes (require JWT middleware in production)
router.get('/profile', getProfile);
router.get('/users', getAllUsers);
router.get('/doctors', getAllDoctors);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/doctors/:id', updateDoctor);
router.delete('/users/:id', deleteUser);

export default router;