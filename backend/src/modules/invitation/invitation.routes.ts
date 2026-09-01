import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validate } from '../../middleware/validate';
import { invitationParamSchema } from './invitation.schema';
import * as invitationController from './invitation.controller';

const router = Router();

router.get(
  '/:eventSlug/:guestToken',
  validate({ params: invitationParamSchema }),
  asyncHandler(invitationController.getInvitation)
);

export { router as invitationRoutes };
