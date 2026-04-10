'use client'

import { useRef, useState } from 'react'
import { parseFile, titleFromFilename } from '@/lib/fileParser'
import { TeleprompterSettings } from '@/lib/useSettings'
import { getColors } from '@/lib/theme'

interface ImportModalProps {
  settings: TeleprompterSettings
  onImport: (title: string, text: string) => void
  onClose: () => void
}

export default function ImportModal({ settings, onImport, onClose }: ImportModalProps) {
  const C = getColors(settings.theme)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const text = await parseFile(file)
      onImport(titleFromFilename(file.name), text)
    } catch {
      setError('Could not read file. Try saving as .txt first.')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 16,
        width: '100%', maxWidth: 480, overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: C.textPrimary }}>Import Script</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: '12px 14px', fontSize: 12, color: C.textSecondary, lineHeight: 1.7,
          }}>
            <p style={{ color: C.textPrimary, fontWeight: 500, marginBottom: 4 }}>Supported formats</p>
            <p>✅ <b style={{ color: C.textPrimary }}>.txt / .md / .rtf</b> — direct text import</p>
            <p>✅ <b style={{ color: C.textPrimary }}>.docx</b> — Word documents (text extracted)</p>
            <p>✅ <b style={{ color: C.textPrimary }}>.enex</b> — Apple Notes export</p>
            <p>⚠️ <b style={{ color: C.textPrimary }}>.pdf / .pages</b> — copy-paste recommended</p>
            <p style={{ marginTop: 8, color: C.textMuted }}>
              <b style={{ color: C.textSecondary }}>Apple Notes:</b> Open note → Share → Save to Files as .txt
            </p>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? C.accent : C.border}`,
              borderRadius: 12, padding: '36px 20px', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              background: dragging ? `${C.accentBg}` : 'transparent',
            }}
          >
            {loading ? (
              <p style={{ color: C.accent, fontSize: 14 }}>Reading file…</p>
            ) : (
              <>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📂</p>
                <p style={{ color: C.textPrimary, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  Tap to browse or drag & drop
                </p>
                <p style={{ color: C.textMuted, fontSize: 12 }}>.txt · .md · .rtf · .docx · .enex · .pdf</p>
              </>
            )}
          </div>

          {error && <p style={{ color: C.dangerText, fontSize: 12, textAlign: 'center' }}>{error}</p>}

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.rtf,.docx,.enex,.pdf,.pages,.text"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
