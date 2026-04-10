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
}

const DARK: Colors = {
  bgApp: '#000000',
  bgPanel: '#1c1c1e',
  bgCard: '#2c2c2e',
  bgInput: '#1c1c1e',
  bgHover: '#3a3a3c',
  border: '#38383a',
  borderStrong: '#545456',
  textPrimary: '#f2f2f7',
  textSecondary: '#aeaeb2',
  textMuted: '#636366',
  textFaint: '#48484a',
  accent: '#f5c842',
  accentDim: '#e0a820',
  accentBg: '#2a1f00',
  accentText: '#000000',
  promptBg: '#000000',
  promptBgAlt: '#0d0d0d',
  danger: '#ff453a',
  dangerBg: '#2c0f0e',
  dangerText: '#ff6b63',
  warningBg: '#1c1400',
  warningBorder: '#4a3200',
  warningText: '#d4a240',
  defaultTextColor: '#f2f2f7',
  btnShadow: '0 2px 4px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)',
  btnShadowActive: 'inset 0 2px 3px rgba(0,0,0,0.5)',
  btnShadowAccent: '0 2px 8px rgba(245,200,66,0.4), 0 1px 3px rgba(0,0,0,0.4)',
}

const LIGHT: Colors = {
  bgApp: '#f2f2f7',
  bgPanel: '#ffffff',
  bgCard: '#f2f2f7',
  bgInput: '#ffffff',
  bgHover: '#e5e5ea',
  border: '#d1d1d6',
  borderStrong: '#aeaeb2',
  textPrimary: '#1c1c1e',
  textSecondary: '#3c3c43',
  textMuted: '#8e8e93',
  textFaint: '#aeaeb2',
  accent: '#bf7500',
  accentDim: '#9e6000',
  accentBg: '#fff8e1',
  accentText: '#ffffff',
  promptBg: '#ffffff',
  promptBgAlt: '#fafaf8',
  danger: '#ff3b30',
  dangerBg: '#fff2f1',
  dangerText: '#d92b20',
  warningBg: '#fffbf0',
  warningBorder: '#ffd60a',
  warningText: '#7d5300',
  defaultTextColor: '#1c1c1e',
  btnShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
  btnShadowActive: 'inset 0 1px 3px rgba(0,0,0,0.10)',
  btnShadowAccent: '0 2px 8px rgba(191,117,0,0.35), 0 1px 3px rgba(0,0,0,0.15)',
}

export function getColors(theme: ColorTheme): Colors {
  return theme === 'light' ? LIGHT : DARK
}
