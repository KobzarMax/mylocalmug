export const palette = {
  ink: '#241A16',
  muted: '#766A63',
  cream: '#F7F2EA',
  paper: '#FFFDFC',
  green: '#235C4B',
  mint: '#DDEBE4',
  orange: '#D9773E',
  line: '#E9E0D7',
  warningPaper: '#FFF3EA',
  warningLine: '#F0C7AD',
  disabled: '#9A908A',
  placeholder: '#9B918A',
  controlTrack: '#D7CEC6',
  disabledPaper: '#EEE9E2',
  nearWhite: '#FFFEFC',
  softOrange: '#F6E3D6',
  star: '#E2A43B',
  heroGreen: '#255F4E',
  heroGreenDark: '#163F35',
  heroText: '#BFD7CE',
  heroHint: '#D8E6E0',
  heroTrack: '#4D786B',
  authGradientStart: '#F8F1E8',
  authGradientEnd: '#E3EEE7',
  white: '#FFFFFF',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;
export const radius = { sm: 10, md: 14, lg: 18, xl: 24, round: 999 } as const;
export const typeScale = {
  overline: 11,
  caption: 12,
  body: 14,
  input: 15,
  subtitle: 18,
  title: 28,
} as const;
export const touchTarget = 44;

export const shadows = {
  card: {
    shadowColor: palette.ink,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
} as const;
