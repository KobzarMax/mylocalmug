import {
  businessBrandPaletteSchema,
  contrastRatio,
  DEFAULT_BUSINESS_PALETTE,
  normalizeBusinessPalette,
  resolveBusinessTheme,
} from '../theme';

describe('business brand theme', () => {
  it('normalizes valid colours and rejects unsafe combinations', () => {
    expect(
      businessBrandPaletteSchema.parse({
        primary: ' #235c4b ',
        accent: '#d06e38',
        background: '#f7f2ea',
      }),
    ).toEqual(DEFAULT_BUSINESS_PALETTE);
    expect(
      businessBrandPaletteSchema.safeParse({
        primary: '#FFFFFF',
        accent: '#FEFEFE',
        background: '#FFFFFF',
      }).success,
    ).toBe(false);
    expect(
      businessBrandPaletteSchema.safeParse({
        primary: 'green',
        accent: '#D9773E',
        background: '#F7F2EA',
      }).success,
    ).toBe(false);
  });

  it('falls back to defaults for absent or invalid persisted values', () => {
    expect(normalizeBusinessPalette(null)).toEqual(DEFAULT_BUSINESS_PALETTE);
    expect(normalizeBusinessPalette({ primary: '#FFFFFF' })).toEqual(DEFAULT_BUSINESS_PALETTE);
  });

  it('derives readable foregrounds for light and dark colours', () => {
    const light = resolveBusinessTheme(DEFAULT_BUSINESS_PALETTE);
    expect(contrastRatio(light.primaryForeground, light.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.text, light.background)).toBeGreaterThanOrEqual(4.5);

    const dark = resolveBusinessTheme({
      primary: '#F7F2EA',
      accent: '#E2A43B',
      background: '#171513',
    });
    expect(dark.text).toBe('#FFFFFF');
    expect(contrastRatio(dark.accentForeground, dark.accent)).toBeGreaterThanOrEqual(4.5);
  });
});
