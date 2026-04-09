'use client'

import { useRef, useState } from 'react'
import { parseFile, titleFromFilename } from '@/lib/fileParser'

interface ImportModalProps {
  onImport: (title: string, text: string) => void
  onClose: () => void
}

export default function ImportModal({ onImport, onClose }: ImportModalProps) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const text = await parseFile(file)
      const title = titleFromFilename(file.name)
      onImport(title, text)
    } catch (e) {
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
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#141414', border: '1px solid #2a2a2a', borderRadius: 16,
        width: '100%', maxWidth: 480, overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #2a2a2a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: '#f0ede8' }}>Import Script</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Info box */}
          <div style={{
            background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 10,
            padding: '12px 14px', fontSize: 12, color: '#666', lineHeight: 1.7,
          }}>
            <p style={{ color: '#888', fontWeight: 500, marginBottom: 4 }}>Supported formats</p>
            <p>✅ <b style={{ color: '#aaa' }}>.txt / .md / .rtf</b> — direct text import</p>
            <p>✅ <b style={{ color: '#aaa' }}>.docx</b> — Word documents (text extracted)</p>
            <p>✅ <b style={{ color: '#aaa' }}>.enex</b> — Apple Notes export</p>
            <p>⚠️ <b style={{ color: '#aaa' }}>.pdf / .pages</b> — copy-paste recommended</p>
            <p style={{ marginTop: 8, color: '#555' }}>
              <b style={{ color: '#666' }}>Apple Notes:</b> Open note → Share → Save to Files as .txt
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#f5c842' : '#333'}`,
              borderRadius: 12, padding: '36px 20px', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              background: dragging ? '#1e1a0020' : 'transparent',
            }}
          >
            {loading ? (
              <p style={{ color: '#f5c842', fontSize: 14 }}>Reading file…</p>
            ) : (
              <>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📂</p>
                <p style={{ color: '#f0ede8', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  Tap to browse or drag & drop
                </p>
                <p style={{ color: '#555', fontSize: 12 }}>.txt · .md · .rtf · .docx · .enex · .pdf</p>
              </>
            )}
          </div>

          {error && (
            <p style={{ color: '#e24b4a', fontSize: 12, textAlign: 'center' }}>{error}</p>
          )}

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
