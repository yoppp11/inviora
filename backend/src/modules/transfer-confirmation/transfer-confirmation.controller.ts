import { Request, Response } from 'express';
import { successResponse } from '../../utils/apiResponse';
import { ValidationError } from '../../utils/errors';
import { submitTransferConfirmationSchema } from './transfer-confirmation.schema';
import * as transferConfirmationService from './transfer-confirmation.service';

export async function submitPublic(req: Request, res: Response) {
  if (!req.file) {
    throw new ValidationError('Proof image is required');
  }

  const parsed = submitTransferConfirmationSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid form data');
  }

  const confirmation = await transferConfirmationService.submitTransferConfirmation(
    req.params.eventSlug as string,
    req.params.guestToken as string,
    parsed.data,
    req.file
  );

  return successResponse(res, confirmation, 201);
}

export async function list(req: Request, res: Response) {
  const confirmations = await transferConfirmationService.listTransferConfirmations(
    req.params.weddingId as string,
    req.user!.userId,
    req.user!.role
  );
  return successResponse(res, confirmations);
}
