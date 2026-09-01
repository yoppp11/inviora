import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import { invitationParamSchema } from '../invitation/invitation.schema';
import { weddingIdParamSchema } from './transfer-confirmation.schema';
import * as transferConfirmationController from './transfer-confirmation.controller';

const publicRouter = Router({ mergeParams: true });

publicRouter.post(
  '/:eventSlug/:guestToken/transfer-confirmations',
  upload.single('proof'),
  validate({ params: invitationParamSchema }),
  asyncHandler(transferConfirmationController.submitPublic)
);

const authenticatedRouter = Router({ mergeParams: true });

authenticatedRouter.use(authenticate);

authenticatedRouter.get(
  '/',
  validate({ params: weddingIdParamSchema }),
  asyncHandler(transferConfirmationController.list)
);

export { publicRouter as transferConfirmationPublicRoutes };
export { authenticatedRouter as transferConfirmationRoutes };
