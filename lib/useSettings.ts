'use client'

import { useState, useEffect } from 'react'

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
      const next = { ...prev, ...patch }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return { settings, update }
}
