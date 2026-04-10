'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Teleprompter from '@/components/Teleprompter'
import EditorModal from '@/components/EditorModal'
import ImportModal from '@/components/ImportModal'
import GoogleDriveModal from '@/components/GoogleDriveModal'
import {
  Script, loadScripts, saveScripts, createScript, updateScript, deleteScript,
} from '@/lib/storage'
import { useTeleprompterSettings } from '@/lib/useSettings'
import { getColors } from '@/lib/theme'

export default function Home() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editorScript, setEditorScript] = useState<Script | null | 'new'>('new')
  const [showEditor, setShowEditor] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showDrive, setShowDrive] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { settings, update } = useTeleprompterSettings()
  const C = getColors(settings.theme)

  useEffect(() => {
    const loaded = loadScripts()
    setScripts(loaded)
    if (loaded.length > 0) setActiveId(loaded[0].id)
  }, [])

  const persist = (updated: Script[]) => {
    setScripts(updated)
    saveScripts(updated)
  }

  const activeScript = scripts.find(s => s.id === activeId) ?? null

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
      {/* Global mobile styles */}
      <style>{`
        * { box-sizing: border-box; }
        body { overscroll-behavior: none; }
        ::-webkit-scrollbar { display: none; }
        @media (max-width: 600px) {
          .sidebar-overlay { display: block !important; }
          .sidebar-push { display: none !important; }
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
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px', height: 50, background: C.bgPanel,
          borderBottom: `1px solid ${C.border}`, flexShrink: 0, gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              title={sidebarOpen ? 'Close sidebar (⌘B)' : 'Open sidebar (⌘B)'}
              style={{
                width: 36, height: 36, background: sidebarOpen ? C.accentBg : 'none',
                border: sidebarOpen ? `1px solid ${C.accentDim}` : `1px solid transparent`,
                borderRadius: 9, color: sidebarOpen ? C.accent : C.textMuted,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              <svg width="16" height="13" viewBox="0 0 16 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="0" y1="1.5" x2="16" y2="1.5" />
                <line x1="0" y1="6.5" x2="16" y2="6.5" />
                <line x1="0" y1="11.5" x2="16" y2="11.5" />
              </svg>
            </button>

            {/* Logo */}
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.accent, letterSpacing: '-0.5px', flexShrink: 0 }}>
              Prompt<span style={{ color: C.textPrimary }}>Cast</span>
            </span>

            {/* Active script title */}
            {activeScript && (
              <span style={{
                fontSize: 12, color: C.textMuted, borderLeft: `1px solid ${C.border}`,
                paddingLeft: 10, marginLeft: 2, maxWidth: 160,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {activeScript.title}
              </span>
            )}
          </div>

          {/* Header actions */}
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <HeaderBtn onClick={handleNew} title="⌘N" C={C}>+ New</HeaderBtn>
            <HeaderBtn onClick={() => setShowImport(true)} accent title="⌘I" C={C}>Import</HeaderBtn>
            {activeScript && <HeaderBtn onClick={() => handleEdit(activeId!)} C={C}>Edit</HeaderBtn>}
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
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                  zIndex: 40, backdropFilter: 'blur(2px)',
                }}
              />
              <div
                className="sidebar-push"
                style={{ display: 'flex', position: 'relative', zIndex: 41 }}
              >
                <Sidebar
                  scripts={scripts} activeId={activeId}
                  onSelect={id => { setActiveId(id); if (window.innerWidth < 600) setSidebarOpen(false) }}
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
            <Teleprompter text={activeScript?.text ?? ''} settings={settings} onSettingChange={update} />
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

function HeaderBtn({ children, onClick, accent, title, C }: {
  children: React.ReactNode, onClick: () => void,
  accent?: boolean, title?: string, C: ReturnType<typeof getColors>,
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: accent ? C.accent : C.bgCard,
        border: `1px solid ${accent ? C.accentDim : C.border}`,
        color: accent ? C.accentText : C.textPrimary,
        padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
        fontSize: 12, fontFamily: 'inherit', fontWeight: accent ? 700 : 500,
        transition: 'all 0.15s',
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
