import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    success: true,
    status: 'UP',
    database: isConnected ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    service: 'ExamEase Examination Registration API',
  });
});

export default router;
