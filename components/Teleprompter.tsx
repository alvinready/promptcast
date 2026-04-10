'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { TeleprompterSettings } from '@/lib/useSettings'
import { getColors } from '@/lib/theme'

interface TeleprompterProps {
  text: string
  settings: TeleprompterSettings
  onSettingChange: (patch: Partial<TeleprompterSettings>) => void
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

/** Render markdown-style **bold** within text */
function RichText({ text, color }: { text: string; color: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} style={{ color, fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

/** Renders the AI-generated keyword bullet output */
function EnhancedView({ text, settings }: { text: string; settings: TeleprompterSettings }) {
  const C = getColors(settings.theme)
  const promptBg = settings.darkBg ? C.promptBg : C.promptBgAlt
  const lines = text.split('\n')

  return (
    <div style={{
      padding: `60px ${settings.padding}px 80vh`,
      maxWidth: 1100,
      margin: '0 auto',
      textAlign: settings.textAlign,
    }}>
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} style={{ height: '1.2em' }} />

        // Section header: **Header Text**
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          const headText = trimmed.slice(2, -2)
          return (
            <p key={i} style={{
              fontSize: settings.fontSize * 0.55,
              fontWeight: 700,
              color: C.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '0.4em',
              marginTop: i === 0 ? 0 : '1.4em',
              fontFamily: 'system-ui, sans-serif',
              lineHeight: 1.3,
            }}>
              {headText}
            </p>
          )
        }

        // Bullet point: • ...
        if (trimmed.startsWith('•')) {
          const content = trimmed.slice(1).trim()
          return (
            <p key={i} style={{
              fontSize: settings.fontSize,
              lineHeight: settings.lineHeight,
              color: settings.textColor,
              marginBottom: '0.5em',
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.5em',
              justifyContent: settings.textAlign === 'center' ? 'center' :
                settings.textAlign === 'right' ? 'flex-end' : 'flex-start',
            }}>
              <span style={{ color: C.accent, fontSize: '0.7em', flexShrink: 0, marginTop: '0.1em' }}>◆</span>
              <RichText text={content} color={C.accent} />
            </p>
          )
        }

        // Other lines (fallback)
        return (
          <p key={i} style={{
            fontSize: settings.fontSize * 0.7,
            lineHeight: settings.lineHeight,
            color: C.textSecondary,
            marginBottom: '0.4em',
            fontFamily: 'system-ui, sans-serif',
          }}>
            <RichText text={trimmed} color={C.accent} />
          </p>
        )
      })}
    </div>
  )
}

export default function Teleprompter({ text, settings, onSettingChange }: TeleprompterProps) {
  const C = getColors(settings.theme)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  // AI enhancement state
  const [enhancedText, setEnhancedText] = useState<string | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'full' | 'bullets'>('full')

  const scrollRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const accumulatorRef = useRef<number>(0)

  // Reset everything when script switches
  useEffect(() => {
    setIsPlaying(false)
    setProgress(0)
    accumulatorRef.current = 0
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    setEnhancedText(null)
    setEnhanceError(null)
    setViewMode('full')
  }, [text])

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

  const togglePlay = useCallback(() => setIsPlaying(p => !p), [])
  const reset = useCallback(() => {
    setIsPlaying(false)
    setProgress(0)
    accumulatorRef.current = 0
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [])
  const nudge = (dir: number) => {
    if (scrollRef.current) scrollRef.current.scrollTop += dir * 100
  }

  // AI enhancement
  const handleEnhance = async () => {
    if (enhancedText) {
      // Toggle view if already enhanced
      setViewMode(m => m === 'full' ? 'bullets' : 'full')
      return
    }
    if (!text.trim()) return
    setIsEnhancing(true)
    setEnhanceError(null)
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setEnhanceError(data.error ?? 'Enhancement failed')
      } else {
        setEnhancedText(data.enhanced)
        setViewMode('bullets')
        // Reset scroll for the new view
        if (scrollRef.current) scrollRef.current.scrollTop = 0
        setProgress(0)
      }
    } catch {
      setEnhanceError('Network error — check your connection')
    } finally {
      setIsEnhancing(false)
    }
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
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [settings.scrollSpeed, onSettingChange, togglePlay, reset])

  const mirrorTransform = (() => {
    if (settings.mirrorH && settings.mirrorV) return 'scale(-1,-1)'
    if (settings.mirrorH) return 'scaleX(-1)'
    if (settings.mirrorV) return 'scaleY(-1)'
    return 'none'
  })()

  const paragraphs = text.split(/\n{2,}/).map(p => p.replace(/\n/g, ' ').trim()).filter(Boolean)
  const readTime = estimateReadTime(text, settings.scrollSpeed)
  const promptBg = settings.darkBg ? C.promptBg : C.promptBgAlt

  const enhanceBtnLabel = isEnhancing
    ? '⏳'
    : enhancedText
      ? (viewMode === 'bullets' ? '📄 Full' : '✨ Keywords')
      : '✨ Keywords'

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: C.bgApp,
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        background: C.bgPanel, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap',
      }}>
        {/* Playback */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ToolBtn onClick={reset} title="Restart (R)" C={C}>⏮</ToolBtn>
          <button onClick={togglePlay} title="Play/Pause (Space)" style={{
            width: 40, height: 40, borderRadius: '50%',
            background: isPlaying ? C.accentDim : C.accent,
            border: 'none', color: C.accentText, fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <ToolBtn onClick={() => nudge(-1)} title="Scroll up (↑)" C={C}>▲</ToolBtn>
          <ToolBtn onClick={() => nudge(1)} title="Scroll down (↓)" C={C}>▼</ToolBtn>
        </div>

        {/* Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: C.textMuted }}>Speed</span>
          <ToolBtn onClick={() => onSettingChange({ scrollSpeed: Math.max(0.2, +(settings.scrollSpeed - 0.5).toFixed(1)) })} C={C}>−</ToolBtn>
          <span style={{ fontSize: 13, fontWeight: 500, minWidth: 36, textAlign: 'center', color: C.textPrimary }}>
            {settings.scrollSpeed.toFixed(1)}×
          </span>
          <ToolBtn onClick={() => onSettingChange({ scrollSpeed: Math.min(5, +(settings.scrollSpeed + 0.5).toFixed(1)) })} C={C}>+</ToolBtn>
          <input
            type="range" min="0.2" max="5" step="0.1" value={settings.scrollSpeed}
            onChange={e => onSettingChange({ scrollSpeed: Number(e.target.value) })}
            style={{ width: 80, accentColor: C.accent }}
          />
        </div>

        {/* AI Enhance button */}
        <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={handleEnhance}
            disabled={isEnhancing || !text.trim()}
            title={enhancedText ? 'Toggle between full script and AI keywords' : 'Generate AI keyword triggers for this script'}
            style={{
              background: viewMode === 'bullets' && enhancedText ? C.accent : C.bgCard,
              border: `1px solid ${viewMode === 'bullets' && enhancedText ? C.accent : C.border}`,
              color: viewMode === 'bullets' && enhancedText ? C.accentText : C.textPrimary,
              padding: '5px 12px', borderRadius: 7, cursor: isEnhancing ? 'wait' : 'pointer',
              fontSize: 12, fontFamily: 'inherit', fontWeight: 500,
              opacity: (!text.trim()) ? 0.4 : 1,
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            {enhanceBtnLabel}
          </button>
          {enhancedText && (
            <button
              onClick={() => { setEnhancedText(null); setViewMode('full') }}
              title="Clear AI enhancement"
              style={{
                background: 'none', border: 'none', color: C.textMuted,
                cursor: 'pointer', fontSize: 14, padding: '2px 4px', lineHeight: 1,
              }}
            >✕</button>
          )}
        </div>

        {/* Status */}
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
          {readTime && (
            <span style={{
              fontSize: 11, color: C.textFaint, background: C.bgCard,
              border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 8px',
            }}>
              {readTime}
            </span>
          )}
          {viewMode === 'bullets' && (
            <span style={{
              fontSize: 11, color: C.accentText, background: C.accent,
              borderRadius: 6, padding: '3px 8px', fontWeight: 600,
            }}>AI Keywords</span>
          )}
          {settings.mirrorH && <Badge C={C}>Mirror H</Badge>}
          {settings.mirrorV && <Badge C={C}>Mirror V</Badge>}
          {isPlaying && <Badge C={C} active>Playing</Badge>}
          <span style={{ fontSize: 11, color: C.textFaint }}>{Math.round(progress * 100)}%</span>
        </div>

        <ToolBtn onClick={toggleFullscreen} title="Fullscreen" C={C}>⛶</ToolBtn>
      </div>

      {/* Enhance error banner */}
      {enhanceError && (
        <div style={{
          background: C.dangerBg, borderBottom: `1px solid ${C.danger}`,
          padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: C.dangerText }}>⚠ {enhanceError}</span>
          <button onClick={() => setEnhanceError(null)} style={{
            background: 'none', border: 'none', color: C.dangerText, cursor: 'pointer', fontSize: 14,
          }}>✕</button>
        </div>
      )}

      {/* Viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: promptBg }}>
        {settings.showCenterLine && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: '50%',
            height: 2, background: `${C.accent}33`,
            pointerEvents: 'none', zIndex: 10,
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
            style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', cursor: 'pointer' }}
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
                maxWidth: 1100,
                margin: '0 auto',
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

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: C.bgCard, pointerEvents: 'none',
        }}>
          <div style={{
            height: '100%', background: C.accent,
            width: `${Math.round(progress * 100)}%`, transition: 'width 0.1s',
          }} />
        </div>
      </div>

      <div style={{
        position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '5px 12px', fontSize: 10, color: C.textFaint, pointerEvents: 'none',
        whiteSpace: 'nowrap', zIndex: 5,
      }}>
        Space: play/pause · ↑↓: nudge · R: restart · +/−: speed · Tap script to play/pause
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
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 8,
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: '10px 18px',
        color: `${C.accent}cc`, fontSize: 13, letterSpacing: '0.5px',
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
    <button onClick={onClick} title={title} style={{
      width: 34, height: 34, background: C.bgCard, border: `1px solid ${C.border}`,
      color: C.textPrimary, borderRadius: 8, cursor: 'pointer', fontSize: 14,
      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = C.bgHover)}
      onMouseLeave={e => (e.currentTarget.style.background = C.bgCard)}
    >
      {children}
    </button>
  )
}

function Badge({ children, active, C }: { children: React.ReactNode, active?: boolean, C: ReturnType<typeof getColors> }) {
  return (
    <span style={{
      padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 500,
      background: active ? C.accentBg : C.bgCard,
      color: active ? C.accent : C.textMuted,
      border: `1px solid ${active ? C.accent : C.border}`,
    }}>{children}</span>
  )
}

function toggleFullscreen() {
  const el = document.documentElement
  if (!document.fullscreenElement) el.requestFullscreen?.()
  else document.exitFullscreen?.()
}
