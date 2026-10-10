import express from 'express';
import { ResourceController } from '../controllers/resourceController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', ResourceController.getResources);
router.get('/:id', ResourceController.getResourceById);
router.patch('/:id/rate', authenticate, requireRole('ADMIN'), ResourceController.updateResourceRate);

export default router;
