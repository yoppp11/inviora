import { prisma } from '../../services/prisma';
import { NotFoundError } from '../../utils/errors';

export async function getInvitation(eventSlug: string, guestToken: string) {
  const event = await prisma.weddingEvent.findUnique({
    where: { slug: eventSlug },
    include: {
      templateConfig: true,
      media: {
        select: {
          id: true,
          secureUrl: true,
          category: true,
          width: true,
          height: true,
        },
      },
    },
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
      name: true,
      address: true,
    },
  });

  if (!guest) {
    throw new NotFoundError('Invitation not found');
  }

  return {
    event: {
      title: event.title,
      slug: event.slug,
      groomName: event.groomName,
      brideName: event.brideName,
      weddingDate: event.weddingDate,
      ceremonyTime: event.ceremonyTime,
      receptionTime: event.receptionTime,
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      mapUrl: event.mapUrl,
      openingText: event.openingText,
      closingText: event.closingText,
    },
    guest: {
      name: guest.name,
      address: guest.address,
    },
    template: {
      key: event.templateConfig?.templateKey ?? 'elegant',
      config: event.templateConfig?.config ?? {},
    },
    media: event.media,
  };
}
