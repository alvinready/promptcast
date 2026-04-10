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
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      background: C.bgApp, color: C.textPrimary,
      fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
      overflow: 'hidden',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 50, background: C.bgPanel,
        borderBottom: `1px solid ${C.border}`, flexShrink: 0, gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 18, padding: '0 4px',
          }}>☰</button>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: C.accent, letterSpacing: '-0.5px' }}>
            Prompt<span style={{ color: C.textPrimary }}>Cast</span>
          </span>
          {activeScript && (
            <span style={{
              fontSize: 12, color: C.textMuted, borderLeft: `1px solid ${C.border}`,
              paddingLeft: 10, marginLeft: 4, maxWidth: 200,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {activeScript.title}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <HeaderBtn onClick={handleNew} title="⌘N" C={C}>+ New</HeaderBtn>
          <HeaderBtn onClick={() => setShowImport(true)} accent title="⌘I" C={C}>Import</HeaderBtn>
          {activeScript && <HeaderBtn onClick={() => handleEdit(activeId!)} C={C}>Edit</HeaderBtn>}
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {sidebarOpen && (
          <Sidebar
            scripts={scripts} activeId={activeId}
            onSelect={id => setActiveId(id)}
            onNew={handleNew} onEdit={handleEdit}
            onDelete={handleDelete} onDuplicate={handleDuplicate}
            onImport={() => setShowImport(true)}
            onGoogleDrive={() => setShowDrive(true)}
            settings={settings} onSettingChange={update}
          />
        )}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <Teleprompter text={activeScript?.text ?? ''} settings={settings} onSettingChange={update} />
        </div>
      </div>

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
    </div>
  )
}

function HeaderBtn({ children, onClick, accent, title, C }: {
  children: React.ReactNode, onClick: () => void,
  accent?: boolean, title?: string, C: ReturnType<typeof getColors>,
}) {
  return (
    <button onClick={onClick} title={title} style={{
      background: accent ? C.accent : C.bgCard,
      border: `1px solid ${accent ? C.accent : C.border}`,
      color: accent ? C.accentText : C.textPrimary,
      padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
      fontSize: 12, fontFamily: 'inherit', fontWeight: accent ? 500 : 400,
      transition: 'all 0.15s',
    }}>
      {children}
    </button>
  )
}
