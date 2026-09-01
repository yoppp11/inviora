import { Request, Response } from 'express';
import { successResponse } from '../../utils/apiResponse';
import { ValidationError } from '../../utils/errors';
import * as mediaService from './media.service';

export async function upload(req: Request, res: Response) {
  if (!req.file) {
    throw new ValidationError('Image file is required');
  }

  const category = req.body.category as string | undefined;
  const media = await mediaService.uploadMedia(
    req.params.weddingId as string,
    req.user!.userId,
    req.user!.role,
    req.file,
    category
  );
  return successResponse(res, media, 201);
}

export async function remove(req: Request, res: Response) {
  await mediaService.deleteMedia(
    req.params.weddingId as string,
    req.params.mediaId as string,
    req.user!.userId,
    req.user!.role
  );
  return successResponse(res, { message: 'Media deleted successfully' });
}

export async function list(req: Request, res: Response) {
  const media = await mediaService.listMedia(
    req.params.weddingId as string,
    req.user!.userId,
    req.user!.role
  );
  return successResponse(res, media);
}
