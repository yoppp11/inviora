import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import { mediaParamSchema, mediaDeleteParamSchema } from './media.schema';
import * as mediaController from './media.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/',
  validate({ params: mediaParamSchema }),
  asyncHandler(mediaController.list)
);

router.post(
  '/',
  validate({ params: mediaParamSchema }),
  upload.single('image'),
  asyncHandler(mediaController.upload)
);

router.delete(
  '/:mediaId',
  validate({ params: mediaDeleteParamSchema }),
  asyncHandler(mediaController.remove)
);

export { router as mediaRoutes };
