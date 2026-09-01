import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { authorizeRole } from '../../middleware/authorize';
import {
  createWeddingSchema,
  updateWeddingSchema,
  weddingIdParam,
} from './wedding.schema';
import * as weddingController from './wedding.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorizeRole('ADMIN'),
  validate({ body: createWeddingSchema }),
  asyncHandler(weddingController.create)
);

router.get('/', asyncHandler(weddingController.list));

router.get(
  '/:id',
  validate({ params: weddingIdParam }),
  asyncHandler(weddingController.getById)
);

router.patch(
  '/:id',
  validate({ params: weddingIdParam, body: updateWeddingSchema }),
  asyncHandler(weddingController.update)
);

router.delete(
  '/:id',
  authorizeRole('ADMIN'),
  validate({ params: weddingIdParam }),
  asyncHandler(weddingController.remove)
);

export { router as weddingRoutes };
