import express from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/reservations', AdminController.getAllReservations);
router.get('/reservations/:id', AdminController.getReservationById);
router.patch('/reservations/:id/status', AdminController.updateReservationStatus);
router.get('/stats', AdminController.getDashboardStats);

router.post('/slots', AdminController.createSlot);
router.get('/slots/next-id', AdminController.getNextSlotId);

export default router;
