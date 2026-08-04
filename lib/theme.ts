export type ColorTheme = 'dark' | 'light'

export interface Colors {
  bgApp: string
  bgPanel: string
  bgCard: string
  bgInput: string
  bgHover: string
  border: string
  borderStrong: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  textFaint: string
  accent: string
  accentDim: string
  accentBg: string
  accentText: string
  promptBg: string
  promptBgAlt: string
  danger: string
  dangerBg: string
  dangerText: string
  warningBg: string
  warningBorder: string
  warningText: string
  defaultTextColor: string
  btnShadow: string
  btnShadowActive: string
  btnShadowAccent: string
  /** Translucent panel surface for floating glass sections (toolbar, popovers) */
  glassBg: string
  glassBorder: string
  /** Translucent card surface for buttons/chips that sit on top of a glass panel */
  glassCard: string
}

// Two clearly separated dark tones — a true near-black app field and a
// distinctly lighter ash-charcoal for panels, with an even lighter gray for
// cards/chips on top of that — so surfaces actually read as layered instead
// of blurring into each other. One bright, saturated blue (Facebook/Shazam
// territory, not indigo) carries every primary action.
const DARK: Colors = {
  bgApp: '#050506',
  bgPanel: '#18181D',
  bgCard: '#28282F',
  bgInput: '#1D1D23',
  bgHover: '#34343D',
  border: '#3E3E49',
  borderStrong: '#52525F',
  textPrimary: '#F8F8FA',
  textSecondary: '#B0B0BC',
  textMuted: '#7C7C89',
  textFaint: '#4A4A56',
  accent: '#2D88FF',
  accentDim: '#1E63C6',
  accentBg: '#102341',
  accentText: '#FFFFFF',
  promptBg: '#000000',
  promptBgAlt: '#0A0A0D',
  danger: '#FF453A',
  dangerBg: '#301613',
  dangerText: '#FF7A70',
  warningBg: '#241C06',
  warningBorder: '#4D3B10',
  warningText: '#E5B24F',
  defaultTextColor: '#F8F8FA',
  btnShadow: '0 2px 6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
  btnShadowActive: 'inset 0 2px 4px rgba(0,0,0,0.5)',
  btnShadowAccent: '0 4px 18px rgba(45,136,255,0.45), 0 1px 3px rgba(0,0,0,0.45)',
  glassBg: 'rgba(24,24,29,0.66)',
  glassBorder: 'rgba(255,255,255,0.1)',
  glassCard: 'rgba(46,46,54,0.62)',
}

const LIGHT: Colors = {
  bgApp: '#EEEEF3',
  bgPanel: '#FFFFFF',
  bgCard: '#E5E5EE',
  bgInput: '#FFFFFF',
  bgHover: '#DADAE6',
  border: '#D6D6E1',
  borderStrong: '#B9B9C8',
  textPrimary: '#15151A',
  textSecondary: '#53535F',
  textMuted: '#858592',
  textFaint: '#B7B7C4',
  accent: '#1877F2',
  accentDim: '#0F5FD1',
  accentBg: '#E4F0FF',
  accentText: '#FFFFFF',
  promptBg: '#FFFFFF',
  promptBgAlt: '#FAFAFD',
  danger: '#E5372E',
  dangerBg: '#FDEEED',
  dangerText: '#C22A21',
  warningBg: '#FFF8E6',
  warningBorder: '#F0C242',
  warningText: '#8A6412',
  defaultTextColor: '#15151A',
  btnShadow: '0 1px 3px rgba(20,20,40,0.1), 0 1px 2px rgba(20,20,40,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
  btnShadowActive: 'inset 0 1px 3px rgba(20,20,40,0.14)',
  btnShadowAccent: '0 4px 16px rgba(24,119,242,0.32), 0 1px 3px rgba(20,20,40,0.14)',
  glassBg: 'rgba(255,255,255,0.66)',
  glassBorder: 'rgba(20,20,40,0.09)',
  glassCard: 'rgba(255,255,255,0.55)',
}

export function getColors(theme: ColorTheme): Colors {
  return theme === 'light' ? LIGHT : DARK
}

// Shared shape + motion vocabulary so every capsule, card, and transition
// across the app comes from one place.
export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
}

export const MOTION = {
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  fast: '140ms',
  base: '220ms',
  slow: '360ms',
}

// Standard blur amount for glass sections — one place to tune it everywhere.
export const GLASS_BLUR = 'blur(22px) saturate(1.4)'
