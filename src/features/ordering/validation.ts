import { z } from 'zod';

export const basketLineSchema = z.object({ menuItemId: z.uuid(), quantity: z.int().min(1).max(99) });
export const basketSchema = z
  .array(basketLineSchema)
  .min(1)
  .max(50)
  .superRefine((lines, context) => {
    const seen = new Set<string>();
    lines.forEach((line, index) => {
      if (seen.has(line.menuItemId))
        context.addIssue({
          code: 'custom',
          path: [index, 'menuItemId'],
          message: 'Combine duplicate menu items.',
        });
      seen.add(line.menuItemId);
    });
  });
export const refundSchema = z.object({
  amountPence: z.int().positive(),
  reason: z.string().trim().min(3).max(500),
});
export function createIdempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 12)}`;
}
export function formatGbp(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
}
