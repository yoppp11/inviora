import { Request, Response } from 'express';
import { successResponse } from '../../utils/apiResponse';
import * as weddingService from './wedding.service';

export async function create(req: Request, res: Response) {
  const wedding = await weddingService.createWedding(
    req.user!.userId,
    req.user!.role,
    req.body
  );
  return successResponse(res, wedding, 201);
}

export async function list(req: Request, res: Response) {
  const weddings = await weddingService.listWeddings(req.user!.userId, req.user!.role);
  return successResponse(res, weddings);
}

export async function getById(req: Request, res: Response) {
  const wedding = await weddingService.getWedding(
    req.params.id as string,
    req.user!.userId,
    req.user!.role
  );
  return successResponse(res, wedding);
}

export async function update(req: Request, res: Response) {
  const wedding = await weddingService.updateWedding(
    req.params.id as string,
    req.user!.userId,
    req.user!.role,
    req.body
  );
  return successResponse(res, wedding);
}

export async function remove(req: Request, res: Response) {
  await weddingService.deleteWedding(
    req.params.id as string,
    req.user!.userId,
    req.user!.role
  );
  return successResponse(res, { message: 'Wedding event deleted successfully' });
}
