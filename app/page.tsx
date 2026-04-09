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

export default function Home() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editorScript, setEditorScript] = useState<Script | null | 'new'>('new') // null=closed, 'new'=new
  const [showEditor, setShowEditor] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showDrive, setShowDrive] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { settings, update } = useTeleprompterSettings()

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

  const handleNew = () => {
    setEditorScript(null)
    setShowEditor(true)
  }

  const handleEdit = (id: string) => {
    const s = scripts.find(s => s.id === id)
    if (s) { setEditorScript(s); setShowEditor(true) }
  }

  const handleDelete = (id: string) => {
    const updated = deleteScript(scripts, id)
    persist(updated)
    if (activeId === id) setActiveId(updated[0]?.id ?? null)
  }

  const handleSave = (title: string, text: string) => {
    if (editorScript && typeof editorScript === 'object') {
      const updated = updateScript(scripts, editorScript.id, { title, text })
      persist(updated)
    } else {
      const s = createScript(title, text)
      const updated = [s, ...scripts]
      persist(updated)
      setActiveId(s.id)
    }
    setShowEditor(false)
  }

  const handleImport = (title: string, text: string) => {
    const s = createScript(title, text)
    const updated = [s, ...scripts]
    persist(updated)
    setActiveId(s.id)
    setShowImport(false)
    setShowDrive(false)
  }

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      background: '#0a0a0a', color: '#f0ede8', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 50, background: '#141414',
        borderBottom: '1px solid #2a2a2a', flexShrink: 0, gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 18, padding: '0 4px',
          }}>☰</button>
          <span style={{
            fontFamily: 'Georgia, serif', fontSize: 18, color: '#f5c842', letterSpacing: '-0.5px',
          }}>
            Prompt<span style={{ color: '#f0ede8' }}>Cast</span>
          </span>
          {activeScript && (
            <span style={{
              fontSize: 12, color: '#555', borderLeft: '1px solid #2a2a2a',
              paddingLeft: 10, marginLeft: 4, maxWidth: 200,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {activeScript.title}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <HeaderBtn onClick={handleNew}>+ New</HeaderBtn>
          <HeaderBtn onClick={() => setShowImport(true)} accent>Import</HeaderBtn>
          {activeScript && (
            <HeaderBtn onClick={() => handleEdit(activeId!)}>Edit</HeaderBtn>
          )}
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {sidebarOpen && (
          <Sidebar
            scripts={scripts}
            activeId={activeId}
            onSelect={id => setActiveId(id)}
            onNew={handleNew}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onImport={() => setShowImport(true)}
            onGoogleDrive={() => setShowDrive(true)}
            settings={settings}
            onSettingChange={update}
          />
        )}

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <Teleprompter
            text={activeScript?.text ?? ''}
            settings={settings}
            onSettingChange={update}
          />
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <div style={{
        position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        background: '#141414', border: '1px solid #2a2a2a', borderRadius: 8,
        padding: '5px 12px', fontSize: 10, color: '#444', pointerEvents: 'none',
        whiteSpace: 'nowrap', zIndex: 5,
      }}>
        Space: play/pause · ↑↓: nudge · R: restart · +/−: speed
      </div>

      {/* Modals */}
      {showEditor && (
        <EditorModal
          script={editorScript && typeof editorScript === 'object' ? editorScript : null}
          onSave={handleSave}
          onClose={() => setShowEditor(false)}
        />
      )}
      {showImport && (
        <ImportModal
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
      {showDrive && (
        <GoogleDriveModal
          clientId={googleClientId}
          onImport={handleImport}
          onClose={() => setShowDrive(false)}
        />
      )}
    </div>
  )
}

function HeaderBtn({ children, onClick, accent }: {
  children: React.ReactNode, onClick: () => void, accent?: boolean,
}) {
  return (
    <button onClick={onClick} style={{
      background: accent ? '#f5c842' : '#1e1e1e',
      border: `1px solid ${accent ? '#f5c842' : '#2a2a2a'}`,
      color: accent ? '#000' : '#f0ede8',
      padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
      fontSize: 12, fontFamily: 'inherit', fontWeight: accent ? 500 : 400,
      transition: 'all 0.15s',
    }}>
      {children}
    </button>
  )
}
