import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createUserSchema, listUsersQuerySchema } from './admin.schema';
import * as adminController from './admin.controller';

const router = Router();

router.use(authenticate, authorizeRole('ADMIN'));

router.post(
  '/users',
  validate({ body: createUserSchema }),
  asyncHandler(adminController.createUser)
);

router.get(
  '/users',
  validate({ query: listUsersQuerySchema }),
  asyncHandler(adminController.listUsers)
);

export { router as adminRoutes };
