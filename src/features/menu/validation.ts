import { z } from 'zod';

import { MENU_CATEGORY_ICON_KEYS } from '../../lib/menuCategoryIcons';

const plainText = /^[^\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]*$/u;

export const normalizeMenuCategoryName = (value: string) => value.trim().replace(/\s+/gu, ' ');

export const menuCategoryInputSchema = z.object({
  name: z
    .string()
    .transform(normalizeMenuCategoryName)
    .pipe(
      z
        .string()
        .min(1, 'Category name is required.')
        .max(60, 'Category name must be 60 characters or fewer.')
        .regex(plainText, 'Category name contains unsupported characters.'),
    ),
  iconKey: z.enum(MENU_CATEGORY_ICON_KEYS),
});

const menuPriceSchema = z
  .string()
  .trim()
  .regex(/^\d{1,8}(?:\.\d{1,2})?$/, 'Enter a valid price with no more than two decimal places.')
  .refine((value) => Number(value) <= 99_999_999.99, 'Price is too large.')
  .transform((value) => Number(value).toFixed(2));

export const menuItemInputSchema = z.object({
  categoryId: z.string().uuid().nullable(),
  name: z
    .string()
    .trim()
    .min(1, 'Item name is required.')
    .max(100, 'Item name must be 100 characters or fewer.')
    .regex(plainText, 'Item name contains unsupported characters.'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer.')
    .regex(plainText, 'Description contains unsupported characters.'),
  price: menuPriceSchema,
  isAvailable: z.boolean(),
});

export type MenuCategoryInput = z.output<typeof menuCategoryInputSchema>;
export type MenuItemInput = z.output<typeof menuItemInputSchema>;
