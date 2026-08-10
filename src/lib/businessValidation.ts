import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((value) => !value || /^https?:\/\//i.test(value), 'Website must start with http:// or https://.');

export const businessApplicationInputSchema = z.object({
  tradingName: z.string().trim().min(2).max(120),
  legalName: z.string().trim().max(160),
  description: z.string().trim().max(1000),
  category: z.string().trim().min(2).max(80),
  contactEmail: z.string().trim().toLowerCase().email().max(254),
  contactPhone: z.string().trim().max(40),
  websiteUrl: optionalUrl,
  address: z.string().trim().min(5).max(300),
  companyNumber: z.string().trim().max(40),
  vatNumber: z.string().trim().max(40),
});

export const businessProfileInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000),
  category: z.string().trim().min(2).max(80),
  contactEmail: z.string().trim().toLowerCase().email().max(254),
  contactPhone: z.string().trim().max(40),
  websiteUrl: optionalUrl,
  address: z.string().trim().min(5).max(300),
});

export type BusinessApplicationInput = z.infer<typeof businessApplicationInputSchema>;
