import { Request, Response } from 'express';
import { successResponse } from '../../utils/apiResponse';
import * as invitationService from './invitation.service';

export async function getInvitation(req: Request, res: Response) {
  const data = await invitationService.getInvitation(
    req.params.eventSlug as string,
    req.params.guestToken as string
  );
  return successResponse(res, data);
}
