import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import {
  createGuestSchema,
  updateGuestSchema,
  guestParamsSchema,
  weddingIdParamSchema,
} from './guest.schema';
import * as guestController from './guest.controller';

const router = Router({ mergeParams: true });
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for CSV
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype !== 'text/csv' &&
      file.mimetype !== 'application/vnd.ms-excel' &&
      !file.originalname.endsWith('.csv')
    ) {
      cb(new Error('Only CSV files are allowed'));
      return;
    }
    cb(null, true);
  },
});

router.use(authenticate);

router.get(
  '/',
  validate({ params: weddingIdParamSchema }),
  asyncHandler(guestController.list)
);

router.post(
  '/',
  validate({ params: weddingIdParamSchema, body: createGuestSchema }),
  asyncHandler(guestController.create)
);

router.post(
  '/import',
  validate({ params: weddingIdParamSchema }),
  csvUpload.single('file'),
  asyncHandler(guestController.importCsv)
);

router.post(
  '/import/preview',
  validate({ params: weddingIdParamSchema }),
  csvUpload.single('file'),
  asyncHandler(guestController.previewCsv)
);

router.patch(
  '/:guestId',
  validate({ params: guestParamsSchema, body: updateGuestSchema }),
  asyncHandler(guestController.update)
);

router.delete(
  '/:guestId',
  validate({ params: guestParamsSchema }),
  asyncHandler(guestController.remove)
);

export { router as guestRoutes };
