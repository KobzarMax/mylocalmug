import { z } from 'zod';

import { BusinessBrandPalette, ResolvedBusinessTheme } from './types';

export const DEFAULT_BUSINESS_PALETTE: BusinessBrandPalette = {
  primary: '#235C4B',
  accent: '#D06E38',
  background: '#F7F2EA',
};

const hexColorSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^#[0-9A-F]{6}$/, 'Use a six-digit hex colour such as #235C4B.'));

export const businessBrandPaletteSchema = z
  .object({ primary: hexColorSchema, accent: hexColorSchema, background: hexColorSchema })
  .superRefine((value, context) => {
    if (contrastRatio(value.primary, value.background) < 3)
      context.addIssue({
        code: 'custom',
        path: ['primary'],
        message: 'Primary must contrast with the background.',
      });
    if (contrastRatio(value.accent, value.background) < 3)
      context.addIssue({
        code: 'custom',
        path: ['accent'],
        message: 'Accent must contrast with the background.',
      });
  });

export function normalizeBusinessPalette(value?: Partial<BusinessBrandPalette> | null): BusinessBrandPalette {
  const parsed = businessBrandPaletteSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_BUSINESS_PALETTE;
}

export function resolveBusinessTheme(value?: Partial<BusinessBrandPalette> | null): ResolvedBusinessTheme {
  const brand = normalizeBusinessPalette(value);
  const text = readableForeground(brand.background);
  return {
    ...brand,
    text,
    mutedText: readableMuted(text, brand.background),
    surface: mixColors(brand.background, text, 0.055),
    border: mixColors(brand.background, text, 0.17),
    primaryForeground: readableForeground(brand.primary),
    accentForeground: readableForeground(brand.accent),
    primarySoft: mixColors(brand.background, brand.primary, 0.16),
    accentSoft: mixColors(brand.background, brand.accent, 0.16),
  };
}

export function contrastRatio(first: string, second: string) {
  const firstLum = relativeLuminance(first);
  const secondLum = relativeLuminance(second);
  return (Math.max(firstLum, secondLum) + 0.05) / (Math.min(firstLum, secondLum) + 0.05);
}

function readableForeground(background: string) {
  return contrastRatio('#000000', background) >= contrastRatio('#FFFFFF', background) ? '#000000' : '#FFFFFF';
}

function readableMuted(text: string, background: string) {
  let result = text;
  for (let amount = 0.45; amount >= 0; amount -= 0.05) {
    const candidate = mixColors(text, background, amount);
    if (contrastRatio(candidate, background) >= 4.5) result = candidate;
    else break;
  }
  return result;
}

function relativeLuminance(color: string) {
  const [red, green, blue] = hexChannels(color).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function mixColors(first: string, second: string, secondAmount: number) {
  const left = hexChannels(first);
  const right = hexChannels(second);
  return `#${left
    .map((channel, index) => Math.round(channel * (1 - secondAmount) + right[index] * secondAmount))
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
}

function hexChannels(color: string) {
  const normalized = color.replace('#', '');
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16));
}
