import { prisma } from '../../services/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { uploadImage } from '../../services/cloudinary.service';
import { assertWeddingAccess } from '../../lib/wedding-access';
import { SubmitTransferConfirmationInput } from './transfer-confirmation.schema';

async function resolveGuestByInvitation(eventSlug: string, guestToken: string) {
  const event = await prisma.weddingEvent.findUnique({
    where: { slug: eventSlug },
    select: { id: true },
  });

  if (!event) {
    throw new NotFoundError('Invitation not found');
  }

  const guest = await prisma.guest.findFirst({
    where: {
      invitationToken: guestToken,
      weddingEventId: event.id,
    },
    select: {
      id: true,
      name: true,
      weddingEventId: true,
    },
  });

  if (!guest) {
    throw new NotFoundError('Invitation not found');
  }

  return guest;
}

export async function submitTransferConfirmation(
  eventSlug: string,
  guestToken: string,
  input: SubmitTransferConfirmationInput,
  proofFile: Express.Multer.File
) {
  const guest = await resolveGuestByInvitation(eventSlug, guestToken);

  const existing = await prisma.transferConfirmation.findFirst({
    where: { guestId: guest.id },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError(
      'Konfirmasi transfer untuk undangan ini sudah pernah dikirim.'
    );
  }

  const upload = await uploadImage(proofFile.buffer, `${guest.weddingEventId}/transfer-proofs`);

  const confirmation = await prisma.transferConfirmation.create({
    data: {
      weddingEventId: guest.weddingEventId,
      guestId: guest.id,
      guestName: guest.name,
      senderName: input.senderName,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      accountHolder: input.accountHolder,
      amount: input.amount,
      transferDate: input.transferDate,
      notes: input.notes,
      proofImageUrl: upload.secureUrl,
      proofPublicId: upload.publicId,
    },
  });

  return confirmation;
}

export async function listTransferConfirmations(
  weddingId: string,
  userId: string,
  role: string
) {
  await assertWeddingAccess(weddingId, userId, role);

  return prisma.transferConfirmation.findMany({
    where: { weddingEventId: weddingId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      guestName: true,
      senderName: true,
      bankName: true,
      accountNumber: true,
      accountHolder: true,
      amount: true,
      transferDate: true,
      notes: true,
      proofImageUrl: true,
      createdAt: true,
    },
  });
}
