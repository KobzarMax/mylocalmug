export type BusinessBrandPalette = {
  primary: string;
  accent: string;
  background: string;
};

export type ResolvedBusinessTheme = BusinessBrandPalette & {
  text: string;
  mutedText: string;
  surface: string;
  border: string;
  primaryForeground: string;
  accentForeground: string;
  primarySoft: string;
  accentSoft: string;
};
