import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/environment.js';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

export const app = express();

// Middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// REST Endpoints
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
