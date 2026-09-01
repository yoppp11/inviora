import { Request, Response } from 'express';
import { successResponse } from '../../utils/apiResponse';
import { ValidationError } from '../../utils/errors';
import * as guestService from './guest.service';

export async function list(req: Request, res: Response) {
  const guests = await guestService.listGuests(
    req.params.weddingId as string,
    req.user!.userId,
    req.user!.role
  );
  return successResponse(res, guests);
}

export async function create(req: Request, res: Response) {
  const guest = await guestService.createGuest(
    req.params.weddingId as string,
    req.user!.userId,
    req.user!.role,
    req.body
  );
  return successResponse(res, guest, 201);
}

export async function update(req: Request, res: Response) {
  const guest = await guestService.updateGuest(
    req.params.weddingId as string,
    req.params.guestId as string,
    req.user!.userId,
    req.user!.role,
    req.body
  );
  return successResponse(res, guest);
}

export async function remove(req: Request, res: Response) {
  await guestService.deleteGuest(
    req.params.weddingId as string,
    req.params.guestId as string,
    req.user!.userId,
    req.user!.role
  );
  return successResponse(res, { message: 'Guest deleted successfully' });
}

export async function importCsv(req: Request, res: Response) {
  if (!req.file) {
    throw new ValidationError('CSV file is required');
  }

  const csvContent = req.file.buffer.toString('utf-8');
  const result = await guestService.importGuests(
    req.params.weddingId as string,
    req.user!.userId,
    req.user!.role,
    csvContent
  );
  return successResponse(res, result, 201);
}

export async function previewCsv(req: Request, res: Response) {
  if (!req.file) {
    throw new ValidationError('CSV file is required');
  }

  const csvContent = req.file.buffer.toString('utf-8');
  const result = await guestService.parseCsvImport(csvContent);
  return successResponse(res, result);
}
