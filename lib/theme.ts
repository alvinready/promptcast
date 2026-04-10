export type ColorTheme = 'dark' | 'light'

export interface Colors {
  bgApp: string
  bgPanel: string
  bgCard: string
  bgInput: string
  bgHover: string
  border: string
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
  defaultTextColor: string // sensible default for the reading area
}

const DARK: Colors = {
  bgApp: '#0a0a0a',
  bgPanel: '#141414',
  bgCard: '#1e1e1e',
  bgInput: '#1e1e1e',
  bgHover: '#282828',
  border: '#2a2a2a',
  textPrimary: '#f0ede8',
  textSecondary: '#888888',
  textMuted: '#555555',
  textFaint: '#444444',
  accent: '#f5c842',
  accentDim: '#e8a020',
  accentBg: '#1e1a00',
  accentText: '#000000',
  promptBg: '#000000',
  promptBgAlt: '#111111',
  danger: '#8b0000',
  dangerBg: '#1a0000',
  dangerText: '#e24b4a',
  warningBg: '#1a1000',
  warningBorder: '#4a3000',
  warningText: '#c8a050',
  defaultTextColor: '#f0ede8',
}

const LIGHT: Colors = {
  bgApp: '#f4f0e8',
  bgPanel: '#ece8de',
  bgCard: '#e4dfd4',
  bgInput: '#e4dfd4',
  bgHover: '#dcd6ca',
  border: '#cfc8bc',
  textPrimary: '#1c1814',
  textSecondary: '#7a736c',
  textMuted: '#9e968e',
  textFaint: '#b0a89e',
  accent: '#b8880a',
  accentDim: '#9a7208',
  accentBg: '#fff3cc',
  accentText: '#000000',
  promptBg: '#f8f4ec',
  promptBgAlt: '#f0ebe0',
  danger: '#cc2200',
  dangerBg: '#ffe8e0',
  dangerText: '#cc2200',
  warningBg: '#fff8e8',
  warningBorder: '#e8c060',
  warningText: '#8a6010',
  defaultTextColor: '#1c1814',
}

export function getColors(theme: ColorTheme): Colors {
  return theme === 'light' ? LIGHT : DARK
}
