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
  /** Translucent surface for glassy overlays (popovers, countdown, banners) */
  glassBg: string
  glassBorder: string
}

// A single periwinkle-indigo accent carries the whole app — calm neutrals
// everywhere else, color only where it means something (play, primary
// actions, active state). Same restrained-glass mood as Opal / Pushr /
// watchOS: soft near-black or near-white fields, one saturated hue, capsules
// instead of squares.
const DARK: Colors = {
  bgApp: '#0A0A0D',
  bgPanel: '#151519',
  bgCard: '#1D1D23',
  bgInput: '#1D1D23',
  bgHover: '#28282F',
  border: '#28282E',
  borderStrong: '#3A3A42',
  textPrimary: '#F5F5F8',
  textSecondary: '#A9A9B4',
  textMuted: '#75757F',
  textFaint: '#48484F',
  accent: '#5865F5',
  accentDim: '#3D45B8',
  accentBg: '#1A1D3D',
  accentText: '#FFFFFF',
  promptBg: '#000000',
  promptBgAlt: '#0C0C10',
  danger: '#FF453A',
  dangerBg: '#2A1210',
  dangerText: '#FF6B63',
  warningBg: '#211A05',
  warningBorder: '#4D3B10',
  warningText: '#E0AC4A',
  defaultTextColor: '#F5F5F8',
  btnShadow: '0 2px 5px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
  btnShadowActive: 'inset 0 2px 4px rgba(0,0,0,0.45)',
  btnShadowAccent: '0 4px 16px rgba(88,101,245,0.4), 0 1px 3px rgba(0,0,0,0.4)',
  glassBg: 'rgba(21,21,25,0.78)',
  glassBorder: 'rgba(255,255,255,0.08)',
}

const LIGHT: Colors = {
  bgApp: '#F4F4F9',
  bgPanel: '#FFFFFF',
  bgCard: '#EFEFF6',
  bgInput: '#FFFFFF',
  bgHover: '#E6E6F0',
  border: '#E2E2EC',
  borderStrong: '#C8C8D6',
  textPrimary: '#17171C',
  textSecondary: '#55555F',
  textMuted: '#87879A',
  textFaint: '#B7B7C4',
  accent: '#4750E8',
  accentDim: '#2F37BE',
  accentBg: '#E8E9FD',
  accentText: '#FFFFFF',
  promptBg: '#FFFFFF',
  promptBgAlt: '#FAFAFD',
  danger: '#E5372E',
  dangerBg: '#FDEEED',
  dangerText: '#C22A21',
  warningBg: '#FFF8E6',
  warningBorder: '#F0C242',
  warningText: '#8A6412',
  defaultTextColor: '#17171C',
  btnShadow: '0 1px 3px rgba(20,20,40,0.08), 0 1px 2px rgba(20,20,40,0.05), inset 0 1px 0 rgba(255,255,255,0.7)',
  btnShadowActive: 'inset 0 1px 3px rgba(20,20,40,0.12)',
  btnShadowAccent: '0 4px 14px rgba(71,80,232,0.28), 0 1px 3px rgba(20,20,40,0.12)',
  glassBg: 'rgba(255,255,255,0.78)',
  glassBorder: 'rgba(20,20,40,0.06)',
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
