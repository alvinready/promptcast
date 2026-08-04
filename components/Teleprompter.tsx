'use client'

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'
import { TeleprompterSettings } from '@/lib/useSettings'
import { getColors, RADIUS, MOTION, GLASS_BLUR, glassSheen } from '@/lib/theme'

export interface TeleprompterHandle {
  toggleFullscreen: () => void
}

interface TeleprompterProps {
  text: string
  settings: TeleprompterSettings
  onSettingChange: (patch: Partial<TeleprompterSettings>) => void
  /** Reports fullscreen state so a parent-level button can reflect it */
  onFullscreenChange?: (isFullscreen: boolean) => void
}

function formatElapsed(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Splits raw script text into paragraphs, tracking how many *extra* blank
// lines preceded each one (beyond the single blank line that normally
// separates paragraphs). This lets someone press Enter several times to
// deliberately push a section further down the screen — each additional
// blank line adds proportional vertical space instead of being collapsed
// away.
function splitParagraphs(text: string): { text: string; gapBefore: number }[] {
  const parts = text.split(/(\n{2,})/)
  const result: { text: string; gapBefore: number }[] = []
  let pendingGap = 0
  for (const part of parts) {
    if (/^\n{2,}$/.test(part)) {
      // A run of N newlines = N-1 blank lines. One blank line is the normal
      // paragraph break; anything beyond that is extra intentional spacing.
      pendingGap = Math.max(0, part.length - 2)
      continue
    }
    const t = part.replace(/\n/g, ' ').trim()
    if (!t) continue
    result.push({ text: t, gapBefore: pendingGap })
    pendingGap = 0
  }
  return result
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
    <div style={{ padding: `20px ${settings.padding}px 50vh`, maxWidth: 1100, margin: '0 auto', textAlign: settings.textAlign }}>
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} style={{ height: '1.2em' }} />

        // Section break — look ahead for the next heading to use as label
        if (trimmed === '---') {
          let nextSection = ''
          for (let j = i + 1; j < lines.length; j++) {
            const next = lines[j].trim()
            if (next.startsWith('**') && next.endsWith('**')) {
              nextSection = next.slice(2, -2).toUpperCase()
              break
            }
            if (next && !next.startsWith('•')) break
          }
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1.8em 0', opacity: 0.8 }}>
              <div style={{ flex: 1, height: 1, background: `${C.accent}55` }} />
              <span style={{
                fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase',
                color: C.accent, fontFamily: 'system-ui, sans-serif', fontWeight: 700,
                whiteSpace: 'nowrap', padding: '0 4px',
              }}>
                {nextSection || '· · ·'}
              </span>
              <div style={{ flex: 1, height: 1, background: `${C.accent}55` }} />
            </div>
          )
        }
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
          // Use inline layout so textAlign cascades correctly from parent
          return (
            <div key={i} style={{
              marginBottom: '0.6em',
              fontSize: settings.fontSize * 0.65,
              lineHeight: settings.lineHeight,
              fontFamily: 'system-ui, sans-serif',
              color: C.textPrimary,
            }}>
              <span style={{ color: C.accent, marginRight: '0.45em' }}>◆</span>
              <RichText text={trimmed.slice(1).trim()} color={C.accent} />
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
  <svg width="22" height="22" viewBox="0 0 18 18" fill="currentColor">
    <polygon points="5,2 16,9 5,16" />
  </svg>
)
const IconPause = () => (
  <svg width="22" height="22" viewBox="0 0 18 18" fill="currentColor">
    <rect x="3" y="2" width="4.5" height="14" rx="1.5" />
    <rect x="10.5" y="2" width="4.5" height="14" rx="1.5" />
  </svg>
)
export const IconFullscreen = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M1 5V2h3M10 2h3v3M14 10v3h-3M5 13H2v-3" />
  </svg>
)
export const IconClose = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="1" y1="1" x2="12" y2="12" />
    <line x1="12" y1="1" x2="1" y2="12" />
  </svg>
)
// Back-to-top: a clear upward arrow, distinct from the play/pause glyphs
const IconArrowUp = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7.5" y1="13" x2="7.5" y2="2.5" />
    <polyline points="3,7 7.5,2.5 12,7" />
  </svg>
)
// Truly optically centered: circle center matches the viewBox center exactly,
// with no external nub or handle throwing off the visual balance inside the
// round button that wraps it.
const IconTimer = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.2" />
    <line x1="8" y1="8" x2="8" y2="4.6" />
    <line x1="8" y1="8" x2="10.6" y2="9.6" />
  </svg>
)

const Teleprompter = forwardRef<TeleprompterHandle, TeleprompterProps>(function Teleprompter(
  { text, settings, onSettingChange, onFullscreenChange }, ref
) {
  const C = getColors(settings.theme)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showInstallTip, setShowInstallTip] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showTimerMenu, setShowTimerMenu] = useState(false)
  const [timerMenuPos, setTimerMenuPos] = useState({ top: 0, left: 0 })
  const timerBtnWrapRef = useRef<HTMLDivElement>(null)
  const timerPopoverRef = useRef<HTMLDivElement>(null)

  // Detect PWA standalone mode (no browser chrome, fullscreen is native)
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      !!(window.navigator as any).standalone
    setIsStandalone(standalone)
  }, [])

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
    setCountdown(null)
  }, [text])

  // Countdown-before-start ticker
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      setCountdown(null)
      setIsPlaying(true)
      return
    }
    const t = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Start-timer popover: the toolbar's root container needs overflow:hidden
  // for fullscreen mode, which would otherwise clip this popover to just its
  // top sliver. Portaling it to document.body (see render below) escapes
  // that clipping entirely; this effect just tracks where it should sit and
  // closes it on an outside click/tap since it's no longer a DOM descendant
  // of the button it's anchored to.
  useEffect(() => {
    if (!showTimerMenu) return
    const btn = timerBtnWrapRef.current
    if (btn) {
      const rect = btn.getBoundingClientRect()
      setTimerMenuPos({ top: rect.bottom + 10, left: rect.left })
    }
    const handleOutside = (e: MouseEvent) => {
      if (timerPopoverRef.current?.contains(e.target as Node)) return
      if (timerBtnWrapRef.current?.contains(e.target as Node)) return
      setShowTimerMenu(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showTimerMenu])

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

  const togglePlay = useCallback(() => {
    // Tapping again while the countdown is running cancels the pending start
    if (countdown !== null) { setCountdown(null); return }
    if (isPlaying) { setIsPlaying(false); return }

    const sc = scrollRef.current
    const atEnd = sc ? sc.scrollTop >= sc.scrollHeight - sc.clientHeight - 20 : false
    if (atEnd) {
      // At the end — restart from top then play
      if (sc) sc.scrollTop = 0
      setProgress(0)
      setElapsed(0)
      accumulatorRef.current = 0
    }

    if (settings.startDelay > 0) setCountdown(settings.startDelay)
    else setIsPlaying(true)
  }, [isPlaying, countdown, settings.startDelay])

  const reset = useCallback(() => {
    setIsPlaying(false)
    setCountdown(null)
    setProgress(0)
    setElapsed(0)
    accumulatorRef.current = 0
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [])

  const nudge = (dir: number) => {
    if (scrollRef.current) scrollRef.current.scrollTop += dir * 100
  }

  const isIOSSafari = useCallback(() => {
    if (typeof navigator === 'undefined') return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  }, [])

  const enterFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const ios = isIOSSafari()
    if (!ios && el.requestFullscreen) {
      // Desktop / Android: use native API (no system X button on these platforms)
      el.requestFullscreen().catch(() => {})
    }
    // iOS: CSS-only fullscreen. webkitRequestFullscreen is intentionally skipped
    // because it adds an un-removable native system X button (rendered above all
    // web content, impossible to cover regardless of z-index). CSS-only gives us
    // a clean toolbar with only our own ✕ button, and the scroll-blocking below
    // prevents the iOS swipe-to-dismiss gesture from firing.
    // True chrome-free fullscreen on iOS requires PWA installation (see tip).
    setIsFullscreen(true)
    if (ios && !isStandalone) {
      try {
        if (!localStorage.getItem('pc_install_tip_shown')) {
          setShowInstallTip(true)
          localStorage.setItem('pc_install_tip_shown', '1')
        }
      } catch {}
    }
  }, [isIOSSafari, isStandalone])

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    else if ((document as any).webkitFullscreenElement) (document as any).webkitExitFullscreen?.()
    setIsFullscreen(false)
  }, [])

  // Fullscreen is now toggled from the app header, not this component's own
  // toolbar — expose it imperatively and report state changes upward.
  useImperativeHandle(ref, () => ({
    toggleFullscreen: () => { isFullscreen ? exitFullscreen() : enterFullscreen() },
  }), [isFullscreen, enterFullscreen, exitFullscreen])

  useEffect(() => { onFullscreenChange?.(isFullscreen) }, [isFullscreen, onFullscreenChange])

  // Listen for native fullscreen exit (Esc on desktop) — not triggered on iOS
  // since we never call webkitRequestFullscreen there
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

  // While fullscreen: block ALL document-level touch movement.
  // Touches inside the scroll container are allowed; everything else is blocked
  // so iOS cannot detect an overscroll and trigger its pull-to-dismiss gesture.
  useEffect(() => {
    if (!isFullscreen) return
    const preventOutside = (e: TouchEvent) => {
      const sc = scrollRef.current
      if (sc && sc.contains(e.target as Node)) return
      e.preventDefault()
    }
    const preventTouchStart = (e: TouchEvent) => {
      const sc = scrollRef.current
      if (sc && sc.contains(e.target as Node)) return
      const container = containerRef.current
      if (container && container.contains(e.target as Node)) return
      e.preventDefault()
    }
    document.addEventListener('touchmove', preventOutside, { passive: false })
    document.addEventListener('touchstart', preventTouchStart, { passive: false })
    return () => {
      document.removeEventListener('touchmove', preventOutside)
      document.removeEventListener('touchstart', preventTouchStart)
    }
  }, [isFullscreen])

  // Lock the page body so it cannot scroll/bounce while our CSS fullscreen is active
  useEffect(() => {
    if (!isFullscreen) return
    const prev = { pos: document.body.style.position, ov: document.body.style.overflow, docOv: document.documentElement.style.overflow }
    document.body.style.position = 'fixed'
    document.body.style.overflow = 'hidden'
    document.body.style.width = '100%'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.position = prev.pos
      document.body.style.overflow = prev.ov
      document.body.style.width = ''
      document.documentElement.style.overflow = prev.docOv
    }
  }, [isFullscreen])

  // Also block overscroll at the top/bottom edges of the scroll container
  useEffect(() => {
    if (!isFullscreen) return
    const sc = scrollRef.current
    if (!sc) return
    let startY = 0
    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY }
    const onMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - startY
      const atTop = sc.scrollTop <= 0
      const atBottom = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2
      if (atTop && dy > 0) { e.preventDefault(); return }
      if (atBottom && dy < 0) { e.preventDefault(); return }
    }
    sc.addEventListener('touchstart', onStart, { passive: true })
    sc.addEventListener('touchmove', onMove, { passive: false })
    return () => {
      sc.removeEventListener('touchstart', onStart)
      sc.removeEventListener('touchmove', onMove)
    }
  }, [isFullscreen])

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
        onSettingChange({ scrollSpeed: Math.min(5, +(settings.scrollSpeed + 0.1).toFixed(1)) })
      if (e.code === 'Minus' || e.code === 'NumpadSubtract')
        onSettingChange({ scrollSpeed: Math.max(0.2, +(settings.scrollSpeed - 0.1).toFixed(1)) })
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

  const paragraphs = splitParagraphs(text)
  const promptBg = settings.darkBg ? C.promptBg : C.promptBgAlt

  // Button content — animated dots while processing, labels otherwise
  const enhanceBtnContent = isEnhancing
    ? <ThinkingDots />
    : enhancedText
      ? (viewMode === 'bullets' ? '📄 Full Script' : 'Ai Simplify')
      : 'Ai Simplify'

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
      {/* Floating exit button — the app header's fullscreen control is
          covered by this fixed-position container once fullscreen is
          active, so an exit affordance has to live in here instead
          (critical on iOS, where our CSS-only fullscreen has no native
          Esc/back gesture). */}
      {isFullscreen && (
        <button
          onClick={exitFullscreen}
          title="Exit fullscreen (F)"
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top) + 10px)',
            right: 'calc(env(safe-area-inset-right) + 10px)',
            zIndex: 10000,
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            border: `1px solid ${C.border}`, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <IconClose />
        </button>
      )}

      {/* Toolbar — a floating glass section, not an edge-to-edge bar. Each
          option still gets its own divider and breathing room inside it. */}
      {/* Bottom padding (not just top) gives the capsule's drop shadow room
          to fade out before the viewport starts — without it the shadow was
          getting hard-cropped by the opaque viewport background right below,
          which read as a broken/cut-off shadow, especially in light mode. */}
      <div style={{ padding: '10px 12px 14px', flexShrink: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px',
        background: glassSheen(C.glassBg), backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR,
        border: `1px solid ${C.glassBorder}`, borderRadius: RADIUS.xl,
        boxShadow: '0 8px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        flexWrap: 'wrap', rowGap: 12,
        minHeight: 64, position: 'relative',
      }}>
        {/* Back to top */}
        <ToolBtn onClick={reset} title="Back to top (R)" C={C}>
          <IconArrowUp />
        </ToolBtn>

        <Divider C={C} />

        {/* Play / Pause — the standalone "● LIVE" badge is gone; the same
            status is now carried by a rotating ring around the button
            itself while playing, so there's no separate pop-up to track. */}
        <div style={{ position: 'relative', flexShrink: 0, width: 52, height: 52 }}>
          {isPlaying && (
            <div style={{
              position: 'absolute', inset: -6, borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: C.accent,
              borderRightColor: `${C.accent}66`,
              animation: 'spin 1.3s linear infinite',
              pointerEvents: 'none',
            }} />
          )}
          <button
            onClick={togglePlay}
            title={countdown !== null ? 'Cancel start' : 'Play/Pause (Space)'}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: isPlaying || countdown !== null ? C.accentDim : C.accentGradient,
              border: 'none',
              color: C.accentText,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: C.btnShadowAccent,
              transition: `background ${MOTION.base} ${MOTION.out}, box-shadow ${MOTION.base} ${MOTION.out}, transform ${MOTION.base} ${MOTION.spring}`,
              fontSize: 20, fontWeight: 700, fontFamily: 'system-ui, sans-serif',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {countdown !== null ? countdown : isPlaying ? <IconPause /> : <IconPlay />}
          </button>
        </div>

        <Divider C={C} />

        {/* Start timer */}
        <div ref={timerBtnWrapRef} style={{ position: 'relative' }}>
          <ToolBtn
            onClick={() => setShowTimerMenu(v => !v)}
            title="Start delay"
            C={C}
            active={settings.startDelay > 0}
            size={42}
          >
            <IconTimer />
          </ToolBtn>
          {settings.startDelay > 0 && (
            <span style={{
              position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16,
              borderRadius: 8, background: C.accent, color: C.accentText,
              fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: '0 3px', fontFamily: 'system-ui, sans-serif',
              pointerEvents: 'none',
            }}>
              {settings.startDelay}
            </span>
          )}
        </div>

        {/* Portaled to document.body so it escapes the container's
            overflow:hidden (needed for fullscreen) instead of being clipped
            to a sliver under the toolbar. */}
        {showTimerMenu && typeof document !== 'undefined' && createPortal(
          <div
            ref={timerPopoverRef}
            style={{
              position: 'fixed', top: timerMenuPos.top, left: timerMenuPos.left, zIndex: 10050,
              background: C.glassBg, backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
              border: `1px solid ${C.glassBorder}`, borderRadius: RADIUS.lg,
              padding: '12px 10px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', width: 104,
              animation: `popIn ${MOTION.base} ${MOTION.spring}`, transformOrigin: 'top left',
            }}
          >
            <p style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, textAlign: 'center' }}>
              Start in
            </p>
            <TimerWheelPicker
              value={settings.startDelay}
              onChange={v => onSettingChange({ startDelay: v })}
              C={C}
            />
          </div>,
          document.body
        )}

        <Divider C={C} />

        {/* Elapsed — a stacked two-line chip. A full pill was crushing the
            text against its own curved caps since it holds two differently
            sized lines, not round/single-line content — a rounded block
            gives it real breathing room instead. */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          minWidth: 60, padding: '7px 16px', borderRadius: RADIUS.md,
          background: glassSheen(C.glassCard), backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR,
          border: `1px solid ${C.border}`,
          transition: `background ${MOTION.base} ${MOTION.out}, border-color ${MOTION.base} ${MOTION.out}`,
        }}>
          <span style={{
            fontVariantNumeric: 'tabular-nums',
            fontSize: 14, fontWeight: 600, color: isPlaying ? C.accent : C.textPrimary,
            lineHeight: 1.3, transition: `color ${MOTION.base} ${MOTION.out}`,
            fontFamily: 'system-ui, sans-serif',
          }}>
            {formatElapsed(elapsed)}
          </span>
          <span style={{ fontSize: 8, color: C.textFaint, letterSpacing: '0.6px', marginTop: 1 }}>
            ELAPSED
          </span>
        </div>

        <Divider C={C} />

        {/* Speed group — a rounded block, not a pill: it holds a rectangular
            wheel, and forcing that into a full capsule was clipping its
            corners against the curve. Blocks for boxy content, pills for
            round/text-only content. The "SPEED" label now stacks above the
            value instead of sitting beside it, trimming enough width for
            Ai Simplify to fit on the same row instead of wrapping. */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
          borderRadius: RADIUS.lg, background: glassSheen(C.glassCard), backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 34 }}>
            <span style={{ fontSize: 8, color: C.textMuted, letterSpacing: '0.4px', textTransform: 'uppercase', lineHeight: 1.3 }}>Speed</span>
            <span style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', color: C.textPrimary, fontVariantNumeric: 'tabular-nums', fontFamily: 'system-ui, sans-serif', lineHeight: 1.3 }}>
              {settings.scrollSpeed.toFixed(1)}×
            </span>
          </div>
          <SpeedWheel
            value={settings.scrollSpeed}
            onChange={v => onSettingChange({ scrollSpeed: v })}
            C={C}
          />
        </div>

        <Divider C={C} />

        {/* AI Keywords */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <button
            onClick={handleEnhance}
            disabled={isEnhancing || !text.trim()}
            title={enhancedText ? 'Toggle full script / Ai Simplify view' : 'Simplify script with Ai'}
            style={{
              background: viewMode === 'bullets' && enhancedText ? C.accentGradient : glassSheen(C.glassCard),
              backdropFilter: viewMode === 'bullets' && enhancedText ? undefined : GLASS_BLUR,
              WebkitBackdropFilter: viewMode === 'bullets' && enhancedText ? undefined : GLASS_BLUR,
              border: `1px solid ${viewMode === 'bullets' && enhancedText ? C.accentDim : C.border}`,
              color: viewMode === 'bullets' && enhancedText ? C.accentText : C.textPrimary,
              padding: '9px 18px', borderRadius: RADIUS.pill, cursor: isEnhancing ? 'wait' : 'pointer',
              fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
              opacity: (!text.trim()) ? 0.4 : 1,
              transition: `all ${MOTION.base} ${MOTION.out}`, whiteSpace: 'nowrap',
              boxShadow: viewMode === 'bullets' && enhancedText ? C.btnShadowAccent : C.btnShadow,
            }}
            onMouseDown={e => (e.currentTarget.style.boxShadow = C.btnShadowActive)}
            onMouseUp={e => (e.currentTarget.style.boxShadow = viewMode === 'bullets' && enhancedText ? C.btnShadowAccent : C.btnShadow)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = viewMode === 'bullets' && enhancedText ? C.btnShadowAccent : C.btnShadow)}
          >
            {enhanceBtnContent}
          </button>
          {enhancedText && (
            <button onClick={() => { setEnhancedText(null); setViewMode('full') }} title="Clear AI keywords" style={{
              background: C.glassCard, backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR,
              border: `1px solid ${C.border}`, color: C.textMuted,
              cursor: 'pointer', fontSize: 12, width: 26, height: 26, lineHeight: 1, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          )}
        </div>

        <Divider C={C} push />

        {/* Status — fullscreen, mirror badges, and the read-time estimate now
            live in the app header up top, so this stays lightweight. Live
            status is now shown by the rotating ring on the play button
            instead of a separate badge here. */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {viewMode === 'bullets' && (
            <span style={{ fontSize: 10, color: C.accentText, background: C.accent, borderRadius: 6, padding: '3px 7px', fontWeight: 700, letterSpacing: '0.3px' }}>AI</span>
          )}
        </div>
      </div>
      </div>

      {/* Install tip — shown once on iOS when entering fullscreen */}
      {showInstallTip && (
        <div style={{
          background: '#121218', borderBottom: `1px solid ${C.accent}55`,
          padding: '10px 16px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📱</span>
            <span style={{ fontSize: 12, color: '#e0e0e0', lineHeight: 1.4 }}>
              <strong style={{ color: C.accent }}>Get true fullscreen:</strong>{' '}
              Tap <strong style={{ color: '#fff' }}>Share ↑ → Add to Home Screen</strong> — installs AiPrompter as an app with no browser bar, no system buttons.
            </span>
          </div>
          <button onClick={() => setShowInstallTip(false)} style={{
            background: 'none', border: 'none', color: '#888', cursor: 'pointer',
            fontSize: 16, padding: '4px 8px', flexShrink: 0,
          }}>✕</button>
        </div>
      )}

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
                padding: `20px ${settings.padding}px 50vh`,
                fontSize: settings.fontSize,
                lineHeight: settings.lineHeight,
                color: settings.textColor,
                textAlign: settings.textAlign,
                fontFamily: 'Georgia, "Times New Roman", serif',
                maxWidth: 1100, margin: '0 auto',
              }}>
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, i) => (
                    <p
                      key={i}
                      style={{
                        marginBottom: '0.85em',
                        // Extra Enter presses in the editor push this paragraph
                        // further down the screen instead of being collapsed.
                        marginTop: p.gapBefore > 0 ? `${p.gapBefore * 1.4}em` : 0,
                      }}
                    >
                      {p.text}
                    </p>
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

        {paragraphs.length > 0 && countdown === null && <TapHint isPlaying={isPlaying} atStart={progress < 0.02} C={C} />}
        {countdown !== null && <CountdownOverlay seconds={countdown} C={C} />}

        {/* Progress bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: C.bgCard, pointerEvents: 'none' }}>
          <div style={{ height: '100%', background: C.accent, width: `${Math.round(progress * 100)}%`, transition: 'width 0.1s' }} />
        </div>
      </div>

      {/* Hint bar — keyboard shortcuts, hidden on touch devices */}
      <div className="kb-hints" style={{
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
      <style>{`@media (pointer: coarse) { .kb-hints { display: none !important; } }`}</style>
    </div>
  )
})

export default Teleprompter

function ThinkingDots() {
  return (
    <>
      <style>{`
        @keyframes aiDotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .ai-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: currentColor; display: inline-block;
          animation: aiDotBounce 1.1s ease-in-out infinite;
        }
        .ai-dot:nth-child(2) { animation-delay: 0.18s; }
        .ai-dot:nth-child(3) { animation-delay: 0.36s; }
      `}</style>
      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', height: '1.1em', verticalAlign: 'middle' }}>
        <span className="ai-dot" />
        <span className="ai-dot" />
        <span className="ai-dot" />
      </span>
    </>
  )
}

function TapHint({ isPlaying, atStart, C }: { isPlaying: boolean; atStart: boolean; C: ReturnType<typeof getColors> }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Only show the hint when at the beginning and not playing
    if (isPlaying || !atStart) { setVisible(false); return }
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2500)
    return () => clearTimeout(t)
  }, [isPlaying, atStart])

  if (!visible) return null

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 8 }}>
      <div style={{
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderRadius: RADIUS.pill, padding: '13px 24px',
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

function CountdownOverlay({ seconds, C }: { seconds: number, C: ReturnType<typeof getColors> }) {
  const R = 58
  const circumference = 2 * Math.PI * R
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 9, background: 'rgba(0,0,0,0.4)',
    }}>
      <div key={seconds} style={{ position: 'relative', width: 132, height: 132, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="132" height="132" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <circle cx="66" cy="66" r={R} fill="none" stroke={C.glassBorder} strokeWidth="4" />
          <circle
            cx="66" cy="66" r={R} fill="none" stroke={C.accent} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ animation: 'countdownRing 1s linear forwards' }}
          />
        </svg>
        <div style={{
          width: 108, height: 108, borderRadius: '50%',
          background: C.glassBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${C.glassBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.accent, fontSize: 50, fontWeight: 700,
          fontFamily: 'system-ui, sans-serif', fontVariantNumeric: 'tabular-nums',
          animation: `countdownPulse ${MOTION.slow} ${MOTION.spring}`,
        }}>
          {seconds}
        </div>
      </div>
      <style>{`
        @keyframes countdownPulse { 0% { transform: scale(1.25); opacity: 0.35; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes countdownRing { from { stroke-dashoffset: 0; } to { stroke-dashoffset: ${circumference}; } }
      `}</style>
    </div>
  )
}

// A slim vertical rule that separates each toolbar option from its
// neighbors. `push` pins it (and everything after it) to the right edge.
function Divider({ C, push }: { C: ReturnType<typeof getColors>, push?: boolean }) {
  return (
    <div style={{
      width: 1, height: 30, background: C.border, borderRadius: 1,
      flexShrink: 0, marginLeft: push ? 'auto' : undefined,
    }} />
  )
}

function ToolBtn({ children, onClick, title, C, active, size = 34 }: {
  children: React.ReactNode, onClick: () => void, title?: string, C: ReturnType<typeof getColors>, active?: boolean, size?: number
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: size, height: size, background: active ? C.accentBg : glassSheen(C.glassCard),
        backdropFilter: active ? undefined : GLASS_BLUR, WebkitBackdropFilter: active ? undefined : GLASS_BLUR,
        border: `1px solid ${active ? C.accentDim : C.border}`,
        color: active ? C.accent : C.textPrimary, borderRadius: '50%', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: `background ${MOTION.fast} ${MOTION.out}, box-shadow ${MOTION.fast} ${MOTION.out}, transform ${MOTION.fast} ${MOTION.spring}`,
        boxShadow: C.btnShadow, flexShrink: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = C.bgHover)}
      onMouseLeave={e => { e.currentTarget.style.background = active ? C.accentBg : glassSheen(C.glassCard); e.currentTarget.style.boxShadow = C.btnShadow; e.currentTarget.style.transform = 'scale(1)' }}
      onMouseDown={e => { e.currentTarget.style.boxShadow = C.btnShadowActive; e.currentTarget.style.transform = 'scale(0.92)' }}
      onMouseUp={e => { e.currentTarget.style.boxShadow = C.btnShadow; e.currentTarget.style.transform = 'scale(1)' }}
    >
      {children}
    </button>
  )
}

// A scrollable, snapping number picker — like an iOS picker wheel. Scroll or
// swipe through 0 ("Off") to 10 seconds; whichever value lands in the
// highlighted center band becomes the selection.
function TimerWheelPicker({ value, onChange, C }: {
  value: number, onChange: (v: number) => void, C: ReturnType<typeof getColors>
}) {
  const options = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const ROW_H = 30
  const VISIBLE_ROWS = 3
  const listRef = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scroll to the current value once, when the picker opens
  useEffect(() => {
    const idx = Math.max(0, options.indexOf(value))
    if (listRef.current) listRef.current.scrollTop = idx * ROW_H
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleScroll = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      const el = listRef.current
      if (!el) return
      const idx = Math.min(options.length - 1, Math.max(0, Math.round(el.scrollTop / ROW_H)))
      el.scrollTo({ top: idx * ROW_H, behavior: 'smooth' })
      if (options[idx] !== value) onChange(options[idx])
    }, 100)
  }

  return (
    <div style={{ position: 'relative', height: ROW_H * VISIBLE_ROWS }}>
      {/* Center selection band */}
      <div style={{
        position: 'absolute', top: ROW_H, left: 0, right: 0, height: ROW_H,
        border: `1px solid ${C.accent}55`, borderRadius: RADIUS.sm,
        background: `${C.accent}15`, pointerEvents: 'none', zIndex: 1,
      }} />
      {/* Fade top/bottom edges — matches the glass popover behind it */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: `linear-gradient(${C.glassBg}, transparent ${ROW_H}px, transparent ${ROW_H * 2}px, ${C.glassBg})`,
      }} />
      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{
          height: ROW_H * VISIBLE_ROWS, overflowY: 'auto', scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none', paddingTop: ROW_H, paddingBottom: ROW_H,
        } as React.CSSProperties}
      >
        {options.map(n => (
          <div
            key={n}
            onClick={() => {
              const idx = options.indexOf(n)
              listRef.current?.scrollTo({ top: idx * ROW_H, behavior: 'smooth' })
              onChange(n)
            }}
            style={{
              height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
              scrollSnapAlign: 'center', cursor: 'pointer',
              fontSize: n === value ? 15 : 13, fontWeight: n === value ? 700 : 500,
              color: n === value ? C.accent : C.textSecondary,
              fontVariantNumeric: 'tabular-nums', fontFamily: 'system-ui, sans-serif',
              transition: 'color 0.1s, font-size 0.1s',
            }}
          >
            {n === 0 ? 'Off' : `${n}s`}
          </div>
        ))}
      </div>
    </div>
  )
}

// A spinning-dial speed control: drag (or trackpad/mouse-wheel scroll)
// vertically to change speed continuously, like turning a physical wheel.
// Swiping up speeds up, swiping down slows down. The moving tick strip and
// center indicator line give it the feel of an actual dial rather than a
// pair of buttons.
function SpeedWheel({ value, onChange, C }: {
  value: number, onChange: (v: number) => void, C: ReturnType<typeof getColors>
}) {
  const MIN = 0.2, MAX = 5, STEP = 0.1
  const PX_PER_STEP = 9 // drag distance (px) per 0.1× change
  const TICK_SPACING = 7
  const dragRef = useRef<{ pointerId: number; startY: number; startValue: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const clamp = (v: number) => Math.min(MAX, Math.max(MIN, +v.toFixed(1)))

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { pointerId: e.pointerId, startY: e.clientY, startValue: value }
    setDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const movedUp = dragRef.current.startY - e.clientY // positive when dragging upward
    const steps = Math.round(movedUp / PX_PER_STEP)
    const next = clamp(dragRef.current.startValue + steps * STEP)
    if (next !== value) onChange(next)
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null
    setDragging(false)
  }
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    onChange(clamp(value + (e.deltaY > 0 ? -STEP : STEP)))
  }

  // Fractional offset so the tick pattern appears to scroll with the value —
  // reinforces the "spinning wheel" feel while dragging.
  const tickOffset = ((value / STEP) * TICK_SPACING) % TICK_SPACING

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={onWheel}
      title="Drag or scroll to adjust speed"
      style={{
        position: 'relative', width: 44, height: 56, borderRadius: RADIUS.md,
        overflow: 'hidden', border: `1px solid ${dragging ? C.accentDim : C.border}`,
        boxShadow: C.btnShadow, flexShrink: 0, background: C.bgCard,
        cursor: dragging ? 'grabbing' : 'ns-resize', touchAction: 'none', userSelect: 'none',
        transition: `border-color ${MOTION.fast} ${MOTION.out}`,
      }}
    >
      {/* Moving tick strip */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `repeating-linear-gradient(0deg, ${C.border} 0, ${C.border} 1px, transparent 1px, transparent ${TICK_SPACING}px)`,
        backgroundPositionY: `${tickOffset}px`,
        opacity: 0.55,
      }} />
      {/* Fade top/bottom edges so ticks appear to emerge/vanish */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(${C.bgCard}, transparent 16px, transparent 40px, ${C.bgCard})`,
      }} />
      {/* Center indicator line */}
      <div style={{
        position: 'absolute', top: '50%', left: 3, right: 3, height: 2, borderRadius: 1,
        background: C.accent, transform: 'translateY(-50%)', pointerEvents: 'none',
      }} />
      {/* Direction hints */}
      <div style={{
        position: 'absolute', top: 4, left: 0, right: 0, display: 'flex', justifyContent: 'center',
        color: C.textFaint, pointerEvents: 'none',
      }}>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><polygon points="5,0 10,6 0,6" /></svg>
      </div>
      <div style={{
        position: 'absolute', bottom: 4, left: 0, right: 0, display: 'flex', justifyContent: 'center',
        color: C.textFaint, pointerEvents: 'none',
      }}>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><polygon points="0,0 10,0 5,6" /></svg>
      </div>
    </div>
  )
}

export function Badge({ children, active, C }: { children: React.ReactNode, active?: boolean, C: ReturnType<typeof getColors> }) {
  return (
    <span style={{
      padding: '4px 10px', borderRadius: RADIUS.pill, fontSize: 10, fontWeight: 600,
      background: active ? C.accentBg : C.bgCard,
      color: active ? C.accent : C.textMuted,
      border: `1px solid ${active ? C.accentDim : C.border}`,
      letterSpacing: '0.3px',
    }}>{children}</span>
  )
}
