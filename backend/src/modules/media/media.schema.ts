import { z } from 'zod';

export const mediaParamSchema = z.object({
  weddingId: z.string().min(1),
});

export const mediaDeleteParamSchema = z.object({
  weddingId: z.string().min(1),
  mediaId: z.string().min(1),
});

export const VALID_CATEGORIES = [
  'hero',
  'bride',
  'groom',
  'couple',
  'gallery',
  'background',
  'content',
] as const;

export type MediaCategory = (typeof VALID_CATEGORIES)[number];
