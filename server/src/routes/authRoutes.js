import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/demo-login', AuthController.demoLogin);
router.get('/me', authenticate, AuthController.getMe);
router.get('/demo-accounts', AuthController.getDemoAccounts);

export default router;
