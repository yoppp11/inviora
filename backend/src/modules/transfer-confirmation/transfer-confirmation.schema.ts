import { z } from 'zod';

export const submitTransferConfirmationSchema = z.object({
  senderName: z.string().min(1, 'Sender name is required').max(120),
  bankName: z.string().min(1, 'Bank name is required').max(80),
  accountNumber: z.string().min(1, 'Account number is required').max(40),
  accountHolder: z.string().min(1, 'Account holder is required').max(120),
  amount: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      const parsed = Number(val.replace(/[^\d.]/g, ''));
      return Number.isFinite(parsed) ? parsed : undefined;
    }),
  transferDate: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      const date = new Date(val);
      return Number.isNaN(date.getTime()) ? undefined : date;
    }),
  notes: z.string().max(500).optional(),
});

export const weddingIdParamSchema = z.object({
  weddingId: z.string().min(1),
});

export type SubmitTransferConfirmationInput = z.infer<typeof submitTransferConfirmationSchema>;
