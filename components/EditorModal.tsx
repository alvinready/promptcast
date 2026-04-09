'use client'

import { useEffect, useRef, useState } from 'react'
import { Script } from '@/lib/storage'

interface EditorModalProps {
  script: Script | null // null = new
  onSave: (title: string, text: string) => void
  onClose: () => void
}

export default function EditorModal({ script, onSave, onClose }: EditorModalProps) {
  const [title, setTitle] = useState(script?.title ?? '')
  const [text, setText] = useState(script?.text ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  const handleSave = () => {
    if (!text.trim()) return
    onSave(title.trim() || 'Untitled', text.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          background: '#141414', border: '1px solid #2a2a2a',
          borderRadius: 16, width: '100%', maxWidth: 720,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #2a2a2a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: '#f0ede8' }}>
            {script ? 'Edit Script' : 'New Script'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 18, lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 16, gap: 10 }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Script title…"
            style={{
              background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#f0ede8',
              padding: '8px 12px', borderRadius: 8, fontSize: 15, fontFamily: 'inherit',
              outline: 'none', width: '100%',
            }}
            onFocus={e => (e.target.style.borderColor = '#f5c842')}
            onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste or type your script here…"
            style={{
              flex: 1, minHeight: 300, background: '#1e1e1e', border: '1px solid #2a2a2a',
              color: '#f0ede8', padding: '12px', borderRadius: 8, fontSize: 15,
              fontFamily: 'inherit', resize: 'none', lineHeight: 1.7, outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = '#f5c842')}
            onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
          />
          <p style={{ fontSize: 11, color: '#444' }}>
            {text.length.toLocaleString()} characters · {text.split(/\s+/).filter(Boolean).length.toLocaleString()} words · ⌘S to save
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid #2a2a2a',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button onClick={onClose} style={{
            background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#888',
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
          }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{
            background: '#f5c842', border: 'none', color: '#000',
            padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
          }}>
            Save Script
          </button>
        </div>
      </div>
    </div>
  )
}
