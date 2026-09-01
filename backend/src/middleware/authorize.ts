import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { prisma } from '../services/prisma';
import { isAdmin } from '../lib/wedding-access';

export function authorizeRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ForbiddenError();
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
}

export function authorizeWeddingOwner(paramKey = 'weddingId') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const weddingId: string | undefined =
      (req.params[paramKey] as string) || (req.params.id as string);

    if (!weddingId) {
      throw new NotFoundError('Wedding event not found');
    }

    if (isAdmin(req.user!.role)) {
      next();
      return;
    }

    const wedding = await prisma.weddingEvent.findUnique({
      where: { id: weddingId },
      select: { userId: true },
    });

    if (!wedding) {
      throw new NotFoundError('Wedding event not found');
    }

    if (wedding.userId !== req.user!.userId) {
      throw new ForbiddenError('You do not have access to this event');
    }

    next();
  };
}
