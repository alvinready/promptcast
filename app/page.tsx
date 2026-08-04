'use client'

import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import Teleprompter, { TeleprompterHandle, IconFullscreen, IconClose, Badge } from '@/components/Teleprompter'
import EditorModal from '@/components/EditorModal'
import ImportModal from '@/components/ImportModal'
import GoogleDriveModal from '@/components/GoogleDriveModal'
import {
  Script, loadScripts, saveScripts, createScript, updateScript, deleteScript,
} from '@/lib/storage'
import { useTeleprompterSettings } from '@/lib/useSettings'
import { getColors, RADIUS, MOTION, GLASS_BLUR, glassSheen } from '@/lib/theme'
import { estimateReadTime } from '@/lib/readTime'

export default function Home() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editorScript, setEditorScript] = useState<Script | null | 'new'>('new')
  const [showEditor, setShowEditor] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showDrive, setShowDrive] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const teleprompterRef = useRef<TeleprompterHandle>(null)
  const { settings, update } = useTeleprompterSettings()
  const C = getColors(settings.theme)

  useEffect(() => {
    const loaded = loadScripts()
    setScripts(loaded)
    if (loaded.length > 0) setActiveId(loaded[0].id)
    // Auto-open sidebar on tablet/desktop, keep closed on phone
    if (window.innerWidth >= 768) setSidebarOpen(true)
  }, [])

  const persist = (updated: Script[]) => {
    setScripts(updated)
    saveScripts(updated)
  }

  const activeScript = scripts.find(s => s.id === activeId) ?? null
  const readTime = activeScript ? estimateReadTime(activeScript.text, settings.scrollSpeed) : ''

  const handleNew = () => { setEditorScript(null); setShowEditor(true) }
  const handleEdit = (id: string) => {
    const s = scripts.find(s => s.id === id)
    if (s) { setEditorScript(s); setShowEditor(true) }
  }
  const handleDelete = (id: string) => {
    const updated = deleteScript(scripts, id)
    persist(updated)
    if (activeId === id) setActiveId(updated[0]?.id ?? null)
  }
  const handleDuplicate = (id: string) => {
    const source = scripts.find(s => s.id === id)
    if (!source) return
    const copy = createScript(`${source.title} (copy)`, source.text)
    const updated = [copy, ...scripts]
    persist(updated)
    setActiveId(copy.id)
  }
  const handleSave = (title: string, text: string) => {
    if (editorScript && typeof editorScript === 'object') {
      persist(updateScript(scripts, editorScript.id, { title, text }))
    } else {
      const s = createScript(title, text)
      persist([s, ...scripts])
      setActiveId(s.id)
    }
    setShowEditor(false)
  }
  const handleImport = (title: string, text: string) => {
    const s = createScript(title, text)
    persist([s, ...scripts])
    setActiveId(s.id)
    setShowImport(false)
    setShowDrive(false)
  }

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === 'n') { e.preventDefault(); handleNew() }
      if (e.key === 'i') { e.preventDefault(); setShowImport(true) }
      if (e.key === 'b') { e.preventDefault(); setSidebarOpen(o => !o) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  return (
    <>
      {/* Global styles */}
      <style>{`
        * { box-sizing: border-box; }
        body { overscroll-behavior: none; }
        ::-webkit-scrollbar { display: none; }
        /* Mobile: sidebar slides in as absolute panel over content */
        @media (max-width: 768px) {
          .sidebar-overlay { display: block !important; }
          .sidebar-push {
            position: absolute !important;
            left: 0; top: 0; bottom: 0;
            width: min(300px, 88vw) !important;
            z-index: 41 !important;
            box-shadow: 4px 0 24px rgba(0,0,0,0.5) !important;
          }
        }
        /* Read-time/mirror status cluster is a nice-to-have — drop it first
           on narrow screens so New/Import/Edit/Fullscreen always fit */
        @media (max-width: 640px) {
          .header-status { display: none !important; }
        }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: C.bgApp, color: C.textPrimary,
        fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
        overflow: 'hidden',
      }}>
        {/* Header — glass panel, distinctly lighter than the near-black app field */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 64, background: glassSheen(C.glassBg),
          backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR,
          borderBottom: `1px solid ${C.border}`, flexShrink: 0, gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              title={sidebarOpen ? 'Close sidebar (⌘B)' : 'Open sidebar (⌘B)'}
              style={{
                width: 40, height: 40, background: sidebarOpen ? C.accentBg : 'none',
                border: sidebarOpen ? `1px solid ${C.accentDim}` : `1px solid transparent`,
                borderRadius: '50%', color: sidebarOpen ? C.accent : C.textMuted,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: `all ${MOTION.fast} ${MOTION.out}`, flexShrink: 0,
              }}
            >
              <svg width="17" height="14" viewBox="0 0 16 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="0" y1="1.5" x2="16" y2="1.5" />
                <line x1="0" y1="6.5" x2="16" y2="6.5" />
                <line x1="0" y1="11.5" x2="16" y2="11.5" />
              </svg>
            </button>

            {/* Logo mark + wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: RADIUS.sm, background: C.accentGradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: C.btnShadowAccent,
              }}>
                <svg width="13" height="13" viewBox="0 0 18 18" fill={C.accentText}><polygon points="5,2 16,9 5,16" /></svg>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, letterSpacing: '-0.2px' }}>
                AiPrompter
              </span>
            </div>

            {/* Active script title */}
            {activeScript && (
              <span style={{
                fontSize: 12, color: C.textMuted, borderLeft: `1px solid ${C.border}`,
                paddingLeft: 14, marginLeft: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                minWidth: 0, flex: 1,
              }}>
                {activeScript.title}
              </span>
            )}
          </div>

          {/* Header actions */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
            {/* Status — read time + mirror indicators, moved up from the
                teleprompter toolbar so everything fits in one header row */}
            <div className="header-status" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {readTime && (
                <span style={{ fontSize: 10, color: C.textFaint, whiteSpace: 'nowrap' }}>{readTime} est.</span>
              )}
              {settings.mirrorH && <Badge C={C}>Mirror H</Badge>}
              {settings.mirrorV && <Badge C={C}>Mirror V</Badge>}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <HeaderBtn onClick={handleNew} title="⌘N" C={C}>New</HeaderBtn>
              <HeaderBtn onClick={() => setShowImport(true)} accent title="⌘I" C={C}>Import</HeaderBtn>
              {activeScript && <HeaderBtn onClick={() => handleEdit(activeId!)} C={C}>Edit</HeaderBtn>}
              <HeaderIconBtn
                onClick={() => teleprompterRef.current?.toggleFullscreen()}
                title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
                C={C}
              >
                {isFullscreen ? <IconClose /> : <IconFullscreen />}
              </HeaderIconBtn>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Sidebar — push layout on tablet/desktop, overlay on mobile */}
          {sidebarOpen && (
            <>
              {/* Mobile overlay backdrop */}
              <div
                className="sidebar-overlay"
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'none',
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
                  zIndex: 40,
                }}
              />
              <div
                className="sidebar-push"
                style={{ display: 'flex', position: 'relative', zIndex: 41 }}
              >
                <Sidebar
                  scripts={scripts} activeId={activeId}
                  onSelect={id => { setActiveId(id); if (window.innerWidth < 768) setSidebarOpen(false) }}
                  onNew={handleNew} onEdit={handleEdit}
                  onDelete={handleDelete} onDuplicate={handleDuplicate}
                  onImport={() => setShowImport(true)}
                  onGoogleDrive={() => setShowDrive(true)}
                  onClose={() => setSidebarOpen(false)}
                  settings={settings} onSettingChange={update}
                />
              </div>
            </>
          )}

          {/* Teleprompter area */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>
            <Teleprompter
              ref={teleprompterRef}
              text={activeScript?.text ?? ''}
              settings={settings}
              onSettingChange={update}
              onFullscreenChange={setIsFullscreen}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditor && (
        <EditorModal
          script={editorScript && typeof editorScript === 'object' ? editorScript : null}
          settings={settings}
          onSave={handleSave}
          onClose={() => setShowEditor(false)}
        />
      )}
      {showImport && (
        <ImportModal settings={settings} onImport={handleImport} onClose={() => setShowImport(false)} />
      )}
      {showDrive && (
        <GoogleDriveModal
          clientId={googleClientId} settings={settings}
          onImport={handleImport} onClose={() => setShowDrive(false)}
        />
      )}
    </>
  )
}

function HeaderIconBtn({ children, onClick, title, C }: {
  children: React.ReactNode, onClick: () => void, title?: string, C: ReturnType<typeof getColors>,
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 40, height: 40, background: glassSheen(C.glassCard),
        backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR,
        border: `1px solid ${C.border}`,
        color: C.textPrimary, borderRadius: '50%', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: `background ${MOTION.fast} ${MOTION.out}, box-shadow ${MOTION.fast} ${MOTION.out}, transform ${MOTION.fast} ${MOTION.spring}`,
        boxShadow: C.btnShadow, flexShrink: 0,
      }}
      onMouseDown={e => { e.currentTarget.style.boxShadow = C.btnShadowActive; e.currentTarget.style.transform = 'scale(0.92)' }}
      onMouseUp={e => { e.currentTarget.style.boxShadow = C.btnShadow; e.currentTarget.style.transform = 'scale(1)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = C.btnShadow; e.currentTarget.style.transform = 'scale(1)' }}
    >
      {children}
    </button>
  )
}

function HeaderBtn({ children, onClick, accent, title, C }: {
  children: React.ReactNode, onClick: () => void,
  accent?: boolean, title?: string, C: ReturnType<typeof getColors>,
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: accent ? C.accentGradient : glassSheen(C.glassCard),
        backdropFilter: accent ? undefined : GLASS_BLUR, WebkitBackdropFilter: accent ? undefined : GLASS_BLUR,
        border: `1px solid ${accent ? C.accentDim : C.border}`,
        color: accent ? C.accentText : C.textPrimary,
        padding: '10px 20px', borderRadius: RADIUS.pill, cursor: 'pointer',
        fontSize: 13, fontFamily: 'inherit', fontWeight: accent ? 700 : 500,
        transition: `all ${MOTION.fast} ${MOTION.out}`,
        boxShadow: accent ? C.btnShadowAccent : C.btnShadow,
        whiteSpace: 'nowrap',
      }}
      onMouseDown={e => (e.currentTarget.style.boxShadow = C.btnShadowActive)}
      onMouseUp={e => (e.currentTarget.style.boxShadow = accent ? C.btnShadowAccent : C.btnShadow)}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = accent ? C.btnShadowAccent : C.btnShadow)}
    >
      {children}
    </button>
  )
}
