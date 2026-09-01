import { Request, Response } from 'express';
import { successResponse } from '../../utils/apiResponse';
import { NotFoundError } from '../../utils/errors';
import * as authService from './auth.service';

export async function login(req: Request, res: Response) {
  const result = await authService.loginUser(req.body);
  return successResponse(res, result);
}

export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return successResponse(res, { user });
}
