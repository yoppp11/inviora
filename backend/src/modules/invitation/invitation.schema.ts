import { z } from 'zod';

export const invitationParamSchema = z.object({
  eventSlug: z.string().min(1),
  guestToken: z.string().min(1),
});
