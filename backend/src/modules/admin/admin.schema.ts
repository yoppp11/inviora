import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'EVENT_OWNER']).default('EVENT_OWNER'),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(['ADMIN', 'EVENT_OWNER']).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
