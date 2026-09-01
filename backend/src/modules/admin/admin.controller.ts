import { Request, Response } from 'express';
import { successResponse } from '../../utils/apiResponse';
import * as adminService from './admin.service';

export async function createUser(req: Request, res: Response) {
  const user = await adminService.createUser(req.body);
  return successResponse(res, user, 201);
}

export async function listUsers(req: Request, res: Response) {
  const role = req.query.role as 'ADMIN' | 'EVENT_OWNER' | undefined;
  const users = await adminService.listUsers(role);
  return successResponse(res, users);
}
