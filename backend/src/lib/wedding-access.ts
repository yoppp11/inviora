import { prisma } from '../services/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';

export type UserRole = 'ADMIN' | 'EVENT_OWNER';

export function isAdmin(role: string): role is 'ADMIN' {
  return role === 'ADMIN';
}

export async function assertWeddingAccess(
  weddingId: string,
  userId: string,
  role: string
) {
  const wedding = await prisma.weddingEvent.findUnique({
    where: { id: weddingId },
    select: { userId: true, isActive: true },
  });

  if (!wedding) {
    throw new NotFoundError('Wedding event not found');
  }

  if (isAdmin(role)) {
    return wedding;
  }

  if (wedding.userId !== userId) {
    throw new ForbiddenError('You do not have access to this event');
  }

  if (!wedding.isActive) {
    throw new ForbiddenError('This event is not active yet. Please contact your administrator.');
  }

  return wedding;
}
