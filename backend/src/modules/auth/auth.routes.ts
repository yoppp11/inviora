import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { loginSchema } from './auth.schema';
import * as authController from './auth.controller';

const router = Router();

router.post(
  '/login',
  validate({ body: loginSchema }),
  asyncHandler(authController.login)
);

router.get('/me', authenticate, asyncHandler(authController.me));

export { router as authRoutes };