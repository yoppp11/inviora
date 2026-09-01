import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createWeddingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100)
    .regex(slugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  groomName: z.string().min(1, 'Groom name is required').max(100),
  brideName: z.string().min(1, 'Bride name is required').max(100),
  weddingDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  ceremonyTime: z.string().max(50).optional().nullable(),
  receptionTime: z.string().max(50).optional().nullable(),
  venueName: z.string().max(200).optional().nullable(),
  venueAddress: z.string().max(500).optional().nullable(),
  mapUrl: z.string().url().max(2000).optional().nullable().or(z.literal('')),
  openingText: z.string().max(2000).optional().nullable(),
  closingText: z.string().max(2000).optional().nullable(),
  ownerUserId: z.string().min(1, 'Event owner is required'),
  isActive: z.boolean().optional().default(false),
});

export const updateWeddingSchema = createWeddingSchema.partial().extend({
  ownerUserId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const weddingIdParam = z.object({
  id: z.string().min(1),
});

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;
export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>;
