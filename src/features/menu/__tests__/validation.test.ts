import { menuCategoryInputSchema, normalizeMenuCategoryName } from '../validation';

describe('menu category validation', () => {
  it('trims and collapses repeated whitespace while preserving display casing', () => {
    expect(normalizeMenuCategoryName('  Tea   & HOT   drinks  ')).toBe('Tea & HOT drinks');
    expect(menuCategoryInputSchema.parse({ name: '  Tea   & HOT   drinks  ', iconKey: 'tea' })).toEqual({
      name: 'Tea & HOT drinks',
      iconKey: 'tea',
    });
  });

  it('rejects empty, overlong, and control-character names', () => {
    expect(menuCategoryInputSchema.safeParse({ name: '   ', iconKey: 'other' }).success).toBe(false);
    expect(menuCategoryInputSchema.safeParse({ name: 'a'.repeat(61), iconKey: 'other' }).success).toBe(false);
    expect(menuCategoryInputSchema.safeParse({ name: 'Coffee\u0000', iconKey: 'coffee' }).success).toBe(
      false,
    );
  });
});

describe('menu category icons', () => {
  it('accepts a supported icon and rejects an unknown icon key', () => {
    expect(menuCategoryInputSchema.safeParse({ name: 'Lunch', iconKey: 'meal' }).success).toBe(true);
    expect(menuCategoryInputSchema.safeParse({ name: 'Lunch', iconKey: 'cutlery' }).success).toBe(false);
  });
});
