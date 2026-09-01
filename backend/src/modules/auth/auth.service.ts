import bcrypt from 'bcryptjs';
import { prisma } from '../../services/prisma';
import { generateAccessToken } from '../../utils/token';
import { UnauthorizedError } from '../../utils/errors';
import { LoginInput } from './auth.schema';

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = generateAccessToken({ userId: user.id, role: user.role });

  let activeEventId: string | null = null;

  if ((user.role as string) === 'EVENT_OWNER') {
    const activeEvent = await prisma.weddingEvent.findFirst({
      where: { userId: user.id, isActive: true },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    activeEventId = activeEvent?.id ?? null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
    activeEventId,
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}
