import { prisma } from '../../services/prisma';
import { ConflictError, NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors';
import { generateSlug } from '../../utils/slug';
import { CreateWeddingInput, UpdateWeddingInput } from './wedding.schema';
import { assertWeddingAccess, isAdmin } from '../../lib/wedding-access';

export async function createWedding(
  actorId: string,
  actorRole: string,
  input: CreateWeddingInput
) {
  if (!isAdmin(actorRole)) {
    throw new ForbiddenError('Only administrators can create wedding events');
  }

  const ownerUserId = input.ownerUserId;
  if (!ownerUserId) {
    throw new ValidationError('Event owner is required');
  }

  const owner = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { id: true, role: true },
  });

  if (!owner) {
    throw new NotFoundError('Event owner user not found');
  }

  if ((owner.role as string) !== 'EVENT_OWNER') {
    throw new ValidationError('Assigned user must have the EVENT_OWNER role');
  }

  const slug = generateSlug(input.slug);

  const existing = await prisma.weddingEvent.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new ConflictError('An event with this slug already exists');
  }

  const wedding = await prisma.weddingEvent.create({
    data: {
      userId: ownerUserId,
      title: input.title,
      slug,
      groomName: input.groomName,
      brideName: input.brideName,
      weddingDate: new Date(input.weddingDate),
      ceremonyTime: input.ceremonyTime ?? null,
      receptionTime: input.receptionTime ?? null,
      venueName: input.venueName ?? null,
      venueAddress: input.venueAddress ?? null,
      mapUrl: input.mapUrl || null,
      openingText: input.openingText ?? null,
      closingText: input.closingText ?? null,
      isActive: input.isActive ?? false,
      templateConfig: {
        create: {
          templateKey: 'elegant',
          config: {},
        },
      },
    },
    include: {
      templateConfig: true,
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { guests: true } },
    },
  });

  return wedding;
}

export async function listWeddings(userId: string, role: string) {
  const where = isAdmin(role) ? {} : { userId, isActive: true };

  return prisma.weddingEvent.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { guests: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getWedding(id: string, userId: string, role: string) {
  await assertWeddingAccess(id, userId, role);

  const wedding = await prisma.weddingEvent.findUnique({
    where: { id },
    include: {
      templateConfig: true,
      media: true,
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { guests: true } },
    },
  });

  if (!wedding) {
    throw new NotFoundError('Wedding event not found');
  }

  return wedding;
}

export async function updateWedding(
  id: string,
  userId: string,
  role: string,
  input: UpdateWeddingInput
) {
  await assertWeddingAccess(id, userId, role);

  const wedding = await prisma.weddingEvent.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!wedding) {
    throw new NotFoundError('Wedding event not found');
  }

  if (input.slug && input.slug !== wedding.slug) {
    const slugNormalized = generateSlug(input.slug);
    const existing = await prisma.weddingEvent.findUnique({
      where: { slug: slugNormalized },
    });
    if (existing) {
      throw new ConflictError('An event with this slug already exists');
    }
    input.slug = slugNormalized;
  }

  if (input.ownerUserId && isAdmin(role)) {
    const owner = await prisma.user.findUnique({
      where: { id: input.ownerUserId },
      select: { id: true, role: true },
    });
    if (!owner) {
      throw new NotFoundError('Event owner user not found');
    }
    if ((owner.role as string) !== 'EVENT_OWNER') {
      throw new ValidationError('Assigned user must have the EVENT_OWNER role');
    }
  } else if (input.ownerUserId && !isAdmin(role)) {
    throw new ForbiddenError('Only administrators can reassign event owners');
  }

  const updated = await prisma.weddingEvent.update({
    where: { id },
    data: {
      ...(input.ownerUserId !== undefined && isAdmin(role) && { userId: input.ownerUserId }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.groomName !== undefined && { groomName: input.groomName }),
      ...(input.brideName !== undefined && { brideName: input.brideName }),
      ...(input.weddingDate !== undefined && {
        weddingDate: new Date(input.weddingDate),
      }),
      ...(input.ceremonyTime !== undefined && {
        ceremonyTime: input.ceremonyTime ?? null,
      }),
      ...(input.receptionTime !== undefined && {
        receptionTime: input.receptionTime ?? null,
      }),
      ...(input.venueName !== undefined && {
        venueName: input.venueName ?? null,
      }),
      ...(input.venueAddress !== undefined && {
        venueAddress: input.venueAddress ?? null,
      }),
      ...(input.mapUrl !== undefined && { mapUrl: input.mapUrl || null }),
      ...(input.openingText !== undefined && {
        openingText: input.openingText ?? null,
      }),
      ...(input.closingText !== undefined && {
        closingText: input.closingText ?? null,
      }),
      ...(input.isActive !== undefined && isAdmin(role) && { isActive: input.isActive }),
    },
    include: {
      templateConfig: true,
      media: true,
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { guests: true } },
    },
  });

  return updated;
}

export async function deleteWedding(id: string, userId: string, role: string) {
  if (!isAdmin(role)) {
    throw new ForbiddenError('Only administrators can delete wedding events');
  }

  await assertWeddingAccess(id, userId, role);
  await prisma.weddingEvent.delete({ where: { id } });
}
