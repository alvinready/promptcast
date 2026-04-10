'use client'

import { useState, useEffect } from 'react'
import { ColorTheme } from './theme'

export interface TeleprompterSettings {
  fontSize: number
  textColor: string
  scrollSpeed: number
  mirrorH: boolean
  mirrorV: boolean
  showCenterLine: boolean
  darkBg: boolean
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
  padding: number
  theme: ColorTheme
}

const DEFAULTS: TeleprompterSettings = {
  fontSize: 42,
  textColor: '#f0ede8',
  scrollSpeed: 1.0,
  mirrorH: false,
  mirrorV: false,
  showCenterLine: false,
  darkBg: true,
  textAlign: 'center',
  lineHeight: 1.9,
  padding: 80,
  theme: 'dark',
}

const STORAGE_KEY = 'promptcast_settings'

export function useTeleprompterSettings() {
  const [settings, setSettings] = useState<TeleprompterSettings>(DEFAULTS)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) })
    } catch {}
  }, [])

  const update = (patch: Partial<TeleprompterSettings>) => {
    setSettings(prev => {
      // When theme changes, auto-reset textColor to a legible default for that theme
      const themeChanged = patch.theme && patch.theme !== prev.theme
      const autoTextColor = themeChanged
        ? (patch.theme === 'light' ? '#1c1814' : '#f0ede8')
        : undefined

      const next = {
        ...prev,
        ...patch,
        ...(autoTextColor ? { textColor: autoTextColor } : {}),
      }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return { settings, update }
}
