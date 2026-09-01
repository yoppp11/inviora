import { prisma } from '../../services/prisma';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { uploadImage, deleteImage } from '../../services/cloudinary.service';
import { VALID_CATEGORIES, MediaCategory } from './media.schema';
import { assertWeddingAccess } from '../../lib/wedding-access';

export async function uploadMedia(
  weddingId: string,
  userId: string,
  role: string,
  file: Express.Multer.File,
  category?: string
) {
  await assertWeddingAccess(weddingId, userId, role);

  if (category && !VALID_CATEGORIES.includes(category as MediaCategory)) {
    throw new ValidationError(
      `Invalid category. Allowed: ${VALID_CATEGORIES.join(', ')}`
    );
  }

  const result = await uploadImage(file.buffer, weddingId);

  const media = await prisma.media.create({
    data: {
      weddingEventId: weddingId,
      publicId: result.publicId,
      secureUrl: result.secureUrl,
      resourceType: result.resourceType,
      width: result.width,
      height: result.height,
      category: category || null,
    },
  });

  return media;
}

export async function deleteMedia(
  weddingId: string,
  mediaId: string,
  userId: string,
  role: string
) {
  await assertWeddingAccess(weddingId, userId, role);

  const media = await prisma.media.findFirst({
    where: { id: mediaId, weddingEventId: weddingId },
  });

  if (!media) throw new NotFoundError('Media not found');

  await prisma.media.delete({ where: { id: mediaId } });
  await deleteImage(media.publicId);
}

export async function listMedia(weddingId: string, userId: string, role: string) {
  await assertWeddingAccess(weddingId, userId, role);

  return prisma.media.findMany({
    where: { weddingEventId: weddingId },
    orderBy: { createdAt: 'desc' },
  });
}
