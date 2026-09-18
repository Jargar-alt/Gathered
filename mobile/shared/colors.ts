/** Gathered brand palette from promo / swatches */
export const palette = {
  slate: '#3D5462',
  mist: '#C8CECD',
  sage: '#9A9D86',
  clay: '#C1A390',
  blush: '#EAD5C9',
  cream: '#EBE3D9',
} as const;

/** Semantic tokens used across the app */
export const colors = {
  background: palette.cream,
  surface: '#F6F1EA',
  surfaceMuted: palette.blush,
  border: palette.mist,
  borderSubtle: '#E0D6CC',
  text: palette.slate,
  textSecondary: '#5C6F7C',
  textMuted: '#7A8B96',
  textSubtle: '#9AA5A3',
  primary: palette.slate,
  onPrimary: palette.cream,
  brand: palette.clay,
  read: palette.sage,
  pray: palette.clay,
  rejoice: palette.mist,
  success: palette.sage,
  danger: '#B4533C',
  dangerSoft: '#F0D8D0',
  white: '#FFFFFF',
} as const;
