import { z } from 'zod';

export const TEMPLATE_KEYS = ['elegant', 'minimal', 'floral', 'noir-elegance'] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export const templateConfigSchema = z.object({
  heroImage: z.string().optional().nullable(),
  bridePhoto: z.string().optional().nullable(),
  groomPhoto: z.string().optional().nullable(),
  coupleImage: z.string().optional().nullable(),
  backgroundImage: z.string().optional().nullable(),
  gallery: z.array(z.string()).max(20).optional().nullable(),
  openingText: z.string().max(2000).optional().nullable(),
  closingText: z.string().max(2000).optional().nullable(),
  primaryColor: z.string().max(20).optional().nullable(),
  secondaryColor: z.string().max(20).optional().nullable(),
  fontFamily: z.string().max(100).optional().nullable(),
  musicEnabled: z.boolean().optional().nullable(),
  musicUrl: z.string().max(2000).optional().nullable(),
  noirContent: z.record(z.unknown()).optional().nullable(),
}).passthrough();

export const updateTemplateSchema = z.object({
  templateKey: z.enum(TEMPLATE_KEYS).optional(),
  config: templateConfigSchema.optional(),
});

export const templateParamSchema = z.object({
  weddingId: z.string().min(1),
});

export type TemplateConfigData = z.infer<typeof templateConfigSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
