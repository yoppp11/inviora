import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { updateTemplateSchema, templateParamSchema } from './template.schema';
import * as templateController from './template.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/',
  validate({ params: templateParamSchema }),
  asyncHandler(templateController.get)
);

router.patch(
  '/',
  validate({ params: templateParamSchema, body: updateTemplateSchema }),
  asyncHandler(templateController.update)
);

export { router as templateRoutes };
