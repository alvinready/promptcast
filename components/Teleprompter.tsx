'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { TeleprompterSettings } from '@/lib/useSettings'
import { getColors } from '@/lib/theme'

interface TeleprompterProps {
  text: string
  settings: TeleprompterSettings
  onSettingChange: (patch: Partial<TeleprompterSettings>) => void
}

function formatElapsed(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function estimateReadTime(text: string, speed: number): string {
  const words = text.split(/\s+/).filter(Boolean).length
  if (words === 0) return ''
  const wpm = Math.round(140 * speed)
  const totalSecs = Math.round((words / wpm) * 60)
  if (totalSecs < 60) return `~${totalSecs}s`
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return s === 0 ? `~${m}m` : `~${m}m ${s}s`
}

function RichText({ text, color }: { text: string; color: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} style={{ color, fontWeight: 700 }}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

function EnhancedView({ text, settings }: { text: string; settings: TeleprompterSettings }) {
  const C = getColors(settings.theme)
  const lines = text.split('\n')
  return (
    <div style={{ padding: `60px ${settings.padding}px 80vh`, maxWidth: 1100, margin: '0 auto', textAlign: settings.textAlign }}>
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} style={{ height: '1.2em' }} />
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return (
            <h3 key={i} style={{
              fontSize: settings.fontSize * 0.75, fontWeight: 700,
              color: C.accent, marginBottom: '0.5em', marginTop: '1.2em',
              fontFamily: 'system-ui, sans-serif', letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}>
              <RichText text={trimmed.slice(2, -2)} color={C.accent} />
            </h3>
          )
        }
        if (trimmed.startsWith('•')) {
          return (
            <div key={i} style={{
              display: 'flex', gap: '0.75em', marginBottom: '0.6em', alignItems: 'flex-start',
            }}>
              <span style={{ color: C.accent, fontSize: settings.fontSize * 0.65, marginTop: '0.1em', flexShrink: 0 }}>◆</span>
              <p style={{ fontSize: settings.fontSize * 0.65, lineHeight: settings.lineHeight, color: C.textPrimary, margin: 0, fontFamily: 'system-ui, sans-serif' }}>
                <RichText text={trimmed.slice(1).trim()} color={C.accent} />
              </p>
            </div>
          )
        }
        return (
          <p key={i} style={{ fontSize: settings.fontSize * 0.6, lineHeight: settings.lineHeight, color: C.textSecondary, marginBottom: '0.4em', fontFamily: 'system-ui, sans-serif' }}>
            <RichText text={trimmed} color={C.accent} />
          </p>
        )
      })}
    </div>
  )
}

// SVG icons
const IconPlay = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <polygon points="5,2 16,9 5,16" />
  </svg>
)
const IconPause = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <rect x="3" y="2" width="4.5" height="14" rx="1.5" />
    <rect x="10.5" y="2" width="4.5" height="14" rx="1.5" />
  </svg>
)
const IconRestart = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="2" x2="3" y2="14" />
    <path d="M7 4H12C13.1 4 14 4.9 14 6V10C14 11.1 13.1 12 12 12H6" />
    <polyline points="3,8 6,5 6,11" transform="translate(0,-4)" />
    <polyline points="5,4.5 3,2 1,4.5" />
  </svg>
)
const IconFullscreen = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M1 5V2h3M10 2h3v3M14 10v3h-3M5 13H2v-3" />
  </svg>
)
const IconClose = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="1" y1="1" x2="12" y2="12" />
    <line x1="12" y1="1" x2="1" y2="12" />
  </svg>
)

export default function Teleprompter({ text, settings, onSettingChange }: TeleprompterProps) {
  const C = getColors(settings.theme)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // AI enhancement state
  const [enhancedText, setEnhancedText] = useState<string | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'full' | 'bullets'>('full')

  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const accumulatorRef = useRef<number>(0)

  // Reset when script switches
  useEffect(() => {
    setIsPlaying(false)
    setProgress(0)
    setElapsed(0)
    accumulatorRef.current = 0
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    setEnhancedText(null)
    setEnhanceError(null)
    setViewMode('full')
  }, [text])

  // Play timer
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [isPlaying])

  // Scroll animation
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
      if (sc.scrollTop >= maxScroll - 2) { setIsPlaying(false); return }
    }
    rafRef.current = requestAnimationFrame(scroll)
  }, [settings.scrollSpeed])

  useEffect(() => {
    if (isPlaying) { lastTimeRef.current = 0; rafRef.current = requestAnimationFrame(scroll) }
    else cancelAnimationFrame(rafRef.current)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, scroll])

  const togglePlay = useCallback(() => setIsPlaying(p => !p), [])

  const reset = useCallback(() => {
    setIsPlaying(false)
    setProgress(0)
    setElapsed(0)
    accumulatorRef.current = 0
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [])

  const nudge = (dir: number) => {
    if (scrollRef.current) scrollRef.current.scrollTop += dir * 100
  }

  // Fullscreen
  const enterFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen()
    setIsFullscreen(true)
  }, [])

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    else if ((document as any).webkitFullscreenElement) (document as any).webkitExitFullscreen?.()
    setIsFullscreen(false)
  }, [])

  useEffect(() => {
    const handler = () => {
      const native = !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
      if (!native) setIsFullscreen(false)
    }
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])

  // AI enhancement
  const handleEnhance = async () => {
    if (enhancedText) { setViewMode(m => m === 'full' ? 'bullets' : 'full'); return }
    if (!text.trim()) return
    setIsEnhancing(true)
    setEnhanceError(null)
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setEnhanceError(data.error ?? 'Enhancement failed') }
      else { setEnhancedText(data.enhanced); setViewMode('bullets'); if (scrollRef.current) scrollRef.current.scrollTop = 0; setProgress(0) }
    } catch { setEnhanceError('Network error — check your connection') }
    finally { setIsEnhancing(false) }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.metaKey || e.ctrlKey) return
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      if (e.code === 'ArrowUp') { e.preventDefault(); nudge(-1) }
      if (e.code === 'ArrowDown') { e.preventDefault(); nudge(1) }
      if (e.code === 'KeyR') { e.preventDefault(); reset() }
      if (e.code === 'Equal' || e.code === 'NumpadAdd')
        onSettingChange({ scrollSpeed: Math.min(5, +(settings.scrollSpeed + 0.5).toFixed(1)) })
      if (e.code === 'Minus' || e.code === 'NumpadSubtract')
        onSettingChange({ scrollSpeed: Math.max(0.2, +(settings.scrollSpeed - 0.5).toFixed(1)) })
      if (e.code === 'KeyF') { e.preventDefault(); isFullscreen ? exitFullscreen() : enterFullscreen() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [settings.scrollSpeed, onSettingChange, togglePlay, reset, isFullscreen, enterFullscreen, exitFullscreen])

  const mirrorTransform = (() => {
    if (settings.mirrorH && settings.mirrorV) return 'scale(-1,-1)'
    if (settings.mirrorH) return 'scaleX(-1)'
    if (settings.mirrorV) return 'scaleY(-1)'
    return 'none'
  })()

  const paragraphs = text.split(/\n{2,}/).map(p => p.replace(/\n/g, ' ').trim()).filter(Boolean)
  const readTime = estimateReadTime(text, settings.scrollSpeed)
  const promptBg = settings.darkBg ? C.promptBg : C.promptBgAlt

  const enhanceBtnLabel = isEnhancing ? '⏳' : enhancedText ? (viewMode === 'bullets' ? '📄 Full' : '✨ Keywords') : '✨ Keywords'

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: C.bgApp,
        ...(isFullscreen ? {
          position: 'fixed' as const,
          inset: 0,
          zIndex: 9999,
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        } : {
          flex: 1,
        }),
      }}
    >
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
        background: C.bgPanel, borderBottom: `1px solid ${C.border}`,
        flexWrap: 'wrap', rowGap: 6, flexShrink: 0,
        minHeight: 56,
      }}>
        {/* Playback group */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Restart button */}
          <ToolBtn onClick={reset} title="Restart from beginning (R)" C={C}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <line x1="2.5" y1="1.5" x2="2.5" y2="13.5" />
              <path d="M2.5 1.5 L5 4 M2.5 1.5 L0 4" />
              <path d="M5.5 4A5 5 0 1 1 2.5 8" />
            </svg>
          </ToolBtn>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            title="Play/Pause (Space)"
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: isPlaying ? C.accentDim : C.accent,
              border: 'none',
              color: C.accentText,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: C.btnShadowAccent,
              transition: 'background 0.15s, box-shadow 0.1s',
              flexShrink: 0,
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.94)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>

          {/* Timer */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minWidth: 36,
          }}>
            <span style={{
              fontVariantNumeric: 'tabular-nums',
              fontSize: 14, fontWeight: 600, color: isPlaying ? C.accent : C.textPrimary,
              lineHeight: 1, transition: 'color 0.2s',
              fontFamily: 'system-ui, sans-serif',
            }}>
              {formatElapsed(elapsed)}
            </span>
            <span style={{ fontSize: 9, color: C.textFaint, letterSpacing: '0.5px', marginTop: 1 }}>
              ELAPSED
            </span>
          </div>

          <ToolBtn onClick={() => nudge(-1)} title="Scroll up (↑)" C={C}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><polygon points="6,1 12,10 0,10"/></svg>
          </ToolBtn>
          <ToolBtn onClick={() => nudge(1)} title="Scroll down (↓)" C={C}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><polygon points="6,11 12,2 0,2"/></svg>
          </ToolBtn>
        </div>

        {/* Speed group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, borderLeft: `1px solid ${C.border}`, paddingLeft: 10 }}>
          <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Speed</span>
          <ToolBtn onClick={() => onSettingChange({ scrollSpeed: Math.max(0.2, +(settings.scrollSpeed - 0.5).toFixed(1)) })} C={C}>
            <svg width="10" height="2" viewBox="0 0 10 2"><rect width="10" height="2" rx="1" fill="currentColor"/></svg>
          </ToolBtn>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 38, textAlign: 'center', color: C.textPrimary, fontVariantNumeric: 'tabular-nums', fontFamily: 'system-ui, sans-serif' }}>
            {settings.scrollSpeed.toFixed(1)}×
          </span>
          <ToolBtn onClick={() => onSettingChange({ scrollSpeed: Math.min(5, +(settings.scrollSpeed + 0.5).toFixed(1)) })} C={C}>
            <svg width="10" height="10" viewBox="0 0 10 10"><rect x="4" y="0" width="2" height="10" rx="1" fill="currentColor"/><rect x="0" y="4" width="10" height="2" rx="1" fill="currentColor"/></svg>
          </ToolBtn>
          <input
            type="range" min="0.2" max="5" step="0.1" value={settings.scrollSpeed}
            onChange={e => onSettingChange({ scrollSpeed: Number(e.target.value) })}
            style={{ width: 70, accentColor: C.accent, cursor: 'pointer' }}
          />
        </div>

        {/* AI Keywords */}
        <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 10, display: 'flex', gap: 5, alignItems: 'center' }}>
          <button
            onClick={handleEnhance}
            disabled={isEnhancing || !text.trim()}
            title={enhancedText ? 'Toggle full script / AI keywords' : 'Generate AI keyword triggers'}
            style={{
              background: viewMode === 'bullets' && enhancedText ? C.accent : C.bgCard,
              border: `1px solid ${viewMode === 'bullets' && enhancedText ? C.accentDim : C.border}`,
              color: viewMode === 'bullets' && enhancedText ? C.accentText : C.textPrimary,
              padding: '7px 16px', borderRadius: 10, cursor: isEnhancing ? 'wait' : 'pointer',
              fontSize: 17, fontFamily: 'inherit', fontWeight: 600,
              opacity: (!text.trim()) ? 0.4 : 1,
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              boxShadow: viewMode === 'bullets' && enhancedText ? C.btnShadowAccent : C.btnShadow,
            }}
            onMouseDown={e => (e.currentTarget.style.boxShadow = C.btnShadowActive)}
            onMouseUp={e => (e.currentTarget.style.boxShadow = viewMode === 'bullets' && enhancedText ? C.btnShadowAccent : C.btnShadow)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = viewMode === 'bullets' && enhancedText ? C.btnShadowAccent : C.btnShadow)}
          >
            {enhanceBtnLabel}
          </button>
          {enhancedText && (
            <button onClick={() => { setEnhancedText(null); setViewMode('full') }} title="Clear AI keywords" style={{
              background: 'none', border: 'none', color: C.textMuted,
              cursor: 'pointer', fontSize: 14, padding: '4px', lineHeight: 1, borderRadius: 6,
            }}>✕</button>
          )}
        </div>

        {/* Status + fullscreen */}
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
          {elapsed > 0 && (
            <span style={{ fontSize: 10, color: C.textFaint }}>
              {readTime && `${readTime} est.`}
            </span>
          )}
          {viewMode === 'bullets' && (
            <span style={{ fontSize: 10, color: C.accentText, background: C.accent, borderRadius: 6, padding: '3px 7px', fontWeight: 700, letterSpacing: '0.3px' }}>AI</span>
          )}
          {settings.mirrorH && <Badge C={C}>Mirror H</Badge>}
          {settings.mirrorV && <Badge C={C}>Mirror V</Badge>}
          {isPlaying && <Badge C={C} active>● LIVE</Badge>}
          <span style={{ fontSize: 11, color: C.textFaint, minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(progress * 100)}%
          </span>
        </div>

        {/* Fullscreen toggle — always visible */}
        {isFullscreen ? (
          <ToolBtn onClick={exitFullscreen} title="Exit fullscreen (F)" C={C}>
            <IconClose />
          </ToolBtn>
        ) : (
          <ToolBtn onClick={enterFullscreen} title="Fullscreen (F)" C={C}>
            <IconFullscreen />
          </ToolBtn>
        )}
      </div>

      {/* Error banner */}
      {enhanceError && (
        <div style={{
          background: C.dangerBg, borderBottom: `1px solid ${C.danger}`,
          padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: C.dangerText }}>⚠ {enhanceError}</span>
          <button onClick={() => setEnhanceError(null)} style={{ background: 'none', border: 'none', color: C.dangerText, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* Viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: promptBg }}>
        {settings.showCenterLine && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: '50%',
            height: 2, background: `${C.accent}33`, pointerEvents: 'none', zIndex: 10,
          }} />
        )}

        <div style={{ height: '100%', transform: mirrorTransform }}>
          <div
            ref={scrollRef}
            onScroll={() => {
              const sc = scrollRef.current
              if (!sc) return
              const max = sc.scrollHeight - sc.clientHeight
              setProgress(max > 0 ? sc.scrollTop / max : 0)
            }}
            onClick={togglePlay}
            style={{
              height: '100%', overflowY: 'auto', overflowX: 'hidden',
              scrollbarWidth: 'none', cursor: 'pointer',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties}
          >
            {viewMode === 'bullets' && enhancedText ? (
              <EnhancedView text={enhancedText} settings={settings} />
            ) : (
              <div style={{
                padding: `60px ${settings.padding}px 80vh`,
                fontSize: settings.fontSize,
                lineHeight: settings.lineHeight,
                color: settings.textColor,
                textAlign: settings.textAlign,
                fontFamily: 'Georgia, "Times New Roman", serif',
                maxWidth: 1100, margin: '0 auto',
              }}>
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, i) => (
                    <p key={i} style={{ marginBottom: '0.85em' }}>{p}</p>
                  ))
                ) : (
                  <p style={{ color: C.textMuted, textAlign: 'center', fontSize: 18, marginTop: 60 }}>
                    Select a script from the sidebar to begin
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {paragraphs.length > 0 && <TapHint isPlaying={isPlaying} C={C} />}

        {/* Progress bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: C.bgCard, pointerEvents: 'none' }}>
          <div style={{ height: '100%', background: C.accent, width: `${Math.round(progress * 100)}%`, transition: 'width 0.1s' }} />
        </div>
      </div>

      {/* Hint bar */}
      <div style={{
        background: C.bgPanel, borderTop: `1px solid ${C.border}`,
        padding: '4px 16px', fontSize: 10, color: C.textFaint,
        display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0,
      }}>
        <span>Space: play/pause</span>
        <span>↑↓: nudge</span>
        <span>R: restart</span>
        <span>+/−: speed</span>
        <span>F: fullscreen</span>
        <span>Tap script: play/pause</span>
      </div>
    </div>
  )
}

function TapHint({ isPlaying, C }: { isPlaying: boolean; C: ReturnType<typeof getColors> }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (isPlaying) { setVisible(false); return }
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2500)
    return () => clearTimeout(t)
  }, [isPlaying])

  if (!visible) return null

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 8 }}>
      <div style={{
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
        borderRadius: 14, padding: '12px 22px',
        color: `${C.accent}dd`, fontSize: 14, letterSpacing: '0.5px', fontWeight: 500,
        border: `1px solid ${C.accent}33`,
        animation: 'fadeOut 2.5s forwards',
      }}>
        Tap to play
      </div>
      <style>{`@keyframes fadeOut { 0%,60%{opacity:1} 100%{opacity:0} }`}</style>
    </div>
  )
}

function ToolBtn({ children, onClick, title, C }: {
  children: React.ReactNode, onClick: () => void, title?: string, C: ReturnType<typeof getColors>
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 34, height: 34, background: C.bgCard, border: `1px solid ${C.border}`,
        color: C.textPrimary, borderRadius: 9, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.12s, box-shadow 0.1s',
        boxShadow: C.btnShadow, flexShrink: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = C.bgHover)}
      onMouseLeave={e => { e.currentTarget.style.background = C.bgCard; e.currentTarget.style.boxShadow = C.btnShadow }}
      onMouseDown={e => (e.currentTarget.style.boxShadow = C.btnShadowActive)}
      onMouseUp={e => (e.currentTarget.style.boxShadow = C.btnShadow)}
    >
      {children}
    </button>
  )
}

function Badge({ children, active, C }: { children: React.ReactNode, active?: boolean, C: ReturnType<typeof getColors> }) {
  return (
    <span style={{
      padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
      background: active ? C.accentBg : C.bgCard,
      color: active ? C.accent : C.textMuted,
      border: `1px solid ${active ? C.accentDim : C.border}`,
      letterSpacing: '0.3px',
    }}>{children}</span>
  )
}
