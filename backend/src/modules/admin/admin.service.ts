import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../services/prisma';
import { ConflictError } from '../../utils/errors';
import { CreateUserInput } from './admin.schema';

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role as Prisma.EnumRoleFieldUpdateOperationsInput['set'],
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function listUsers(role?: 'ADMIN' | 'EVENT_OWNER') {
  return prisma.user.findMany({
    where: role ? { role: role as Prisma.EnumRoleFilter['equals'] } : undefined,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { weddingEvents: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
