import { z } from 'zod';

export const invitationInputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(['admin', 'manager', 'finance', 'barista', 'viewer']),
});

export const invitationTokenSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{48}$/i, 'Enter the 48-character invitation code.');
