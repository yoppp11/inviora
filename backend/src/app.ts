import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { weddingRoutes } from './modules/wedding/wedding.routes';
import { guestRoutes } from './modules/guest/guest.routes';
import { templateRoutes } from './modules/template/template.routes';
import { mediaRoutes } from './modules/media/media.routes';
import { invitationRoutes } from './modules/invitation/invitation.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { logger } from './utils/logger';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.length === 1 ? env.CORS_ORIGIN[0] : env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Inviora API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/weddings', weddingRoutes);
app.use('/api/weddings/:weddingId/guests', guestRoutes);
app.use('/api/weddings/:weddingId/template', templateRoutes);
app.use('/api/weddings/:weddingId/media', mediaRoutes);
app.use('/api/public/invitations', invitationRoutes);

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use(errorHandler);
