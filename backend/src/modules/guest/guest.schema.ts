import { z } from 'zod';

export const createGuestSchema = z.object({
  name: z.string().min(1, 'Guest name is required').max(200),
  address: z.string().max(500).optional().nullable(),
});

export const updateGuestSchema = createGuestSchema.partial();

export const guestParamsSchema = z.object({
  weddingId: z.string().min(1),
  guestId: z.string().min(1),
});

export const weddingIdParamSchema = z.object({
  weddingId: z.string().min(1),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
