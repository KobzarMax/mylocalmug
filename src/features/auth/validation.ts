import { z } from 'zod';

import { displayNameSchema, profileEmailSchema, profilePasswordSchema } from '../../lib/profileValidation';

export const signInSchema = z.object({
  email: profileEmailSchema,
  password: z.string().min(1, 'Enter your password.'),
});

export const registrationSchema = z.object({
  displayName: displayNameSchema,
  email: profileEmailSchema,
  password: profilePasswordSchema,
});

export const emailOtpSchema = z
  .string()
  .trim()
  .regex(/^\d{6,8}$/, 'Enter the numeric code from your confirmation email.');

export const pendingEmailSchema = profileEmailSchema;
