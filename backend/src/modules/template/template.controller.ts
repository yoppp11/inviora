import { Request, Response } from 'express';
import { successResponse } from '../../utils/apiResponse';
import * as templateService from './template.service';

export async function get(req: Request, res: Response) {
  const config = await templateService.getTemplateConfig(
    req.params.weddingId as string,
    req.user!.userId,
    req.user!.role
  );
  return successResponse(res, config);
}

export async function update(req: Request, res: Response) {
  const config = await templateService.updateTemplateConfig(
    req.params.weddingId as string,
    req.user!.userId,
    req.user!.role,
    req.body
  );
  return successResponse(res, config);
}
