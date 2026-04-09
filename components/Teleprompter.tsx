'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { TeleprompterSettings } from '@/lib/useSettings'

interface TeleprompterProps {
  text: string
  settings: TeleprompterSettings
  onSettingChange: (patch: Partial<TeleprompterSettings>) => void
}

export default function Teleprompter({ text, settings, onSettingChange }: TeleprompterProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const accumulatorRef = useRef<number>(0)

  // Smooth scroll loop using requestAnimationFrame
  const scroll = useCallback((timestamp: number) => {
    if (!scrollRef.current) return
    const delta = timestamp - (lastTimeRef.current || timestamp)
    lastTimeRef.current = timestamp
    accumulatorRef.current += (delta / 1000) * settings.scrollSpeed * 40

    if (accumulatorRef.current >= 1) {
      const px = Math.floor(accumulatorRef.current)
      accumulatorRef.current -= px
      scrollRef.current.scrollTop += px

      const sc = scrollRef.current
      const maxScroll = sc.scrollHeight - sc.clientHeight
      const pct = maxScroll > 0 ? sc.scrollTop / maxScroll : 0
      setProgress(pct)

      if (sc.scrollTop >= maxScroll - 2) {
        setIsPlaying(false)
        return
      }
    }
    rafRef.current = requestAnimationFrame(scroll)
  }, [settings.scrollSpeed])

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0
      rafRef.current = requestAnimationFrame(scroll)
    } else {
      cancelAnimationFrame(rafRef.current)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, scroll])

  const togglePlay = () => setIsPlaying(p => !p)
  const reset = () => {
    setIsPlaying(false)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    setProgress(0)
  }
  const nudge = (dir: number) => {
    if (scrollRef.current) scrollRef.current.scrollTop += dir * 100
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      if (e.code === 'ArrowUp') { e.preventDefault(); nudge(-1) }
      if (e.code === 'ArrowDown') { e.preventDefault(); nudge(1) }
      if (e.code === 'KeyR') { e.preventDefault(); reset() }
      if (e.code === 'Equal' || e.code === 'NumpadAdd') onSettingChange({ scrollSpeed: Math.min(5, +(settings.scrollSpeed + 0.5).toFixed(1)) })
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') onSettingChange({ scrollSpeed: Math.max(0.2, +(settings.scrollSpeed - 0.5).toFixed(1)) })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [settings.scrollSpeed, onSettingChange])

  const mirrorTransform = (() => {
    if (settings.mirrorH && settings.mirrorV) return 'scale(-1,-1)'
    if (settings.mirrorH) return 'scaleX(-1)'
    if (settings.mirrorV) return 'scaleY(-1)'
    return 'none'
  })()

  const paragraphs = text.split(/\n{2,}/).map(p => p.replace(/\n/g, ' ').trim()).filter(Boolean)

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: '#0a0a0a',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        background: '#141414', borderBottom: '1px solid #2a2a2a', flexWrap: 'wrap',
      }}>
        {/* Playback */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ToolBtn onClick={reset} title="Restart (R)">⏮</ToolBtn>
          <button onClick={togglePlay} title="Play/Pause (Space)" style={{
            width: 40, height: 40, borderRadius: '50%', background: isPlaying ? '#e8a020' : '#f5c842',
            border: 'none', color: '#000', fontSize: 16, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s',
          }}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <ToolBtn onClick={() => nudge(-1)} title="Scroll up (↑)">▲</ToolBtn>
          <ToolBtn onClick={() => nudge(1)} title="Scroll down (↓)">▼</ToolBtn>
        </div>

        {/* Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#555' }}>Speed</span>
          <ToolBtn onClick={() => onSettingChange({ scrollSpeed: Math.max(0.2, +(settings.scrollSpeed - 0.5).toFixed(1)) })}>−</ToolBtn>
          <span style={{
            fontSize: 13, fontWeight: 500, minWidth: 36, textAlign: 'center',
            color: '#f0ede8',
          }}>{settings.scrollSpeed.toFixed(1)}×</span>
          <ToolBtn onClick={() => onSettingChange({ scrollSpeed: Math.min(5, +(settings.scrollSpeed + 0.5).toFixed(1)) })}>+</ToolBtn>
          <input
            type="range" min="0.2" max="5" step="0.1" value={settings.scrollSpeed}
            onChange={e => onSettingChange({ scrollSpeed: Number(e.target.value) })}
            style={{ width: 80, accentColor: '#f5c842' }}
          />
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: 5, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {settings.mirrorH && <Badge>Mirror H</Badge>}
          {settings.mirrorV && <Badge>Mirror V</Badge>}
          {isPlaying && <Badge active>Playing</Badge>}
          <span style={{ fontSize: 11, color: '#444' }}>
            {Math.round(progress * 100)}%
          </span>
        </div>

        {/* Fullscreen */}
        <ToolBtn onClick={toggleFullscreen} title="Fullscreen">⛶</ToolBtn>
      </div>

      {/* Viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: settings.darkBg ? '#000' : '#111' }}>
        {/* Center guide */}
        {settings.showCenterLine && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: '50%',
            height: 2, background: 'rgba(245,200,66,0.2)',
            pointerEvents: 'none', zIndex: 10,
          }} />
        )}

        {/* Mirror wrapper */}
        <div style={{ height: '100%', transform: mirrorTransform }}>
          <div
            ref={scrollRef}
            onScroll={() => {
              const sc = scrollRef.current
              if (!sc) return
              const max = sc.scrollHeight - sc.clientHeight
              setProgress(max > 0 ? sc.scrollTop / max : 0)
            }}
            style={{
              height: '100%', overflowY: 'auto', overflowX: 'hidden',
              scrollbarWidth: 'none',
            }}
          >
            <div style={{
              padding: `60px ${settings.padding}px 80vh`,
              fontSize: settings.fontSize,
              lineHeight: settings.lineHeight,
              color: settings.textColor,
              textAlign: settings.textAlign,
              fontFamily: 'Georgia, "Times New Roman", serif',
              maxWidth: 1100,
              margin: '0 auto',
            }}>
              {paragraphs.length > 0 ? (
                paragraphs.map((p, i) => (
                  <p key={i} style={{ marginBottom: '0.85em' }}>{p}</p>
                ))
              ) : (
                <p style={{ color: '#333', textAlign: 'center', fontSize: 18, marginTop: 60 }}>
                  Select a script from the sidebar to begin
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#1e1e1e',
        }}>
          <div style={{
            height: '100%', background: '#f5c842',
            width: `${Math.round(progress * 100)}%`, transition: 'width 0.1s',
          }} />
        </div>
      </div>

      {/* Touch controls overlay for iPad (shown on touch) */}
      <div style={{
        position: 'absolute', bottom: 20, right: 20,
        display: 'flex', flexDirection: 'column', gap: 6, zIndex: 20,
        opacity: 0,
      }} id="touch-controls" />
    </div>
  )
}

function ToolBtn({ children, onClick, title }: { children: React.ReactNode, onClick: () => void, title?: string }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 34, height: 34, background: '#1e1e1e', border: '1px solid #2a2a2a',
      color: '#f0ede8', borderRadius: 8, cursor: 'pointer', fontSize: 14,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = '#282828')}
      onMouseLeave={e => (e.currentTarget.style.background = '#1e1e1e')}
    >
      {children}
    </button>
  )
}

function Badge({ children, active }: { children: React.ReactNode, active?: boolean }) {
  return (
    <span style={{
      padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 500,
      background: active ? '#1e1a00' : '#1e1e1e',
      color: active ? '#f5c842' : '#666',
      border: `1px solid ${active ? '#f5c842' : '#2a2a2a'}`,
    }}>{children}</span>
  )
}

function toggleFullscreen() {
  const el = document.documentElement
  if (!document.fullscreenElement) {
    el.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}
