import { menuCategoryInputSchema, normalizeMenuCategoryName } from '../validation';

describe('menu category validation', () => {
  it('trims and collapses repeated whitespace while preserving display casing', () => {
    expect(normalizeMenuCategoryName('  Tea   & HOT   drinks  ')).toBe('Tea & HOT drinks');
    expect(menuCategoryInputSchema.parse({ name: '  Tea   & HOT   drinks  ' })).toEqual({
      name: 'Tea & HOT drinks',
    });
  });

  it('rejects empty, overlong, and control-character names', () => {
    expect(menuCategoryInputSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(menuCategoryInputSchema.safeParse({ name: 'a'.repeat(61) }).success).toBe(false);
    expect(menuCategoryInputSchema.safeParse({ name: 'Coffee\u0000' }).success).toBe(false);
  });
});
