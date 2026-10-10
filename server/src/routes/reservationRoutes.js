import express from 'express';
import { ReservationController } from '../controllers/reservationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', ReservationController.createReservation);
router.get('/my', ReservationController.getMyReservations);
router.get('/:id', ReservationController.getReservationById);
router.post('/:id/cancel', ReservationController.cancelReservation);

export default router;
