import { z } from 'zod';

export const PROFILE_DESCRIPTION_MAX_LENGTH = 200;
export const PROFILE_DISPLAY_NAME_MAX_LENGTH = 80;
export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const plainText = /^[^\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]*$/u;

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required.')
  .max(PROFILE_DISPLAY_NAME_MAX_LENGTH, 'Name must be 80 characters or fewer.')
  .regex(plainText, 'Name contains unsupported control characters.');

export const profileDescriptionSchema = z
  .string()
  .trim()
  .max(PROFILE_DESCRIPTION_MAX_LENGTH, 'Description must be 200 characters or fewer.')
  .regex(plainText, 'Description contains unsupported control characters.');

export const avatarPathSchema = z
  .string()
  .regex(/^[0-9a-f-]{36}\/avatar-[0-9]+\.(jpg|png|webp)$/, 'Avatar path is invalid.');

export const profileUpdateInputSchema = z.object({
  displayName: displayNameSchema,
  description: profileDescriptionSchema,
  avatarPath: avatarPathSchema.nullable(),
});

export const favoriteBusinessInputSchema = z.object({
  businessId: z.string().uuid(),
});

export const avatarUploadIntentInputSchema = z.object({
  mimeType: z.enum(PROFILE_IMAGE_MIME_TYPES),
  size: z.number().int().positive().max(PROFILE_IMAGE_MAX_BYTES),
});

export const profileEmailSchema = z.string().trim().toLowerCase().email().max(254);
export const profilePasswordSchema = z.string().min(8).max(128);

export type ProfileUpdateInput = z.infer<typeof profileUpdateInputSchema>;
export type ProfileImageMime = (typeof PROFILE_IMAGE_MIME_TYPES)[number];
