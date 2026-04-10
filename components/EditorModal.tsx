'use client'

import { useEffect, useRef, useState } from 'react'
import { Script } from '@/lib/storage'
import { TeleprompterSettings } from '@/lib/useSettings'
import { getColors } from '@/lib/theme'

interface EditorModalProps {
  script: Script | null
  settings: TeleprompterSettings
  onSave: (title: string, text: string) => void
  onClose: () => void
}

function wordCount(t: string) { return t.split(/\s+/).filter(Boolean).length }

function readTime(text: string): string {
  const words = wordCount(text)
  if (words === 0) return ''
  const totalSecs = Math.round((words / 140) * 60)
  if (totalSecs < 60) return `~${totalSecs}s`
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return s === 0 ? `~${m}m` : `~${m}m ${s}s`
}

export default function EditorModal({ script, settings, onSave, onClose }: EditorModalProps) {
  const C = getColors(settings.theme)
  const [title, setTitle] = useState(script?.title ?? '')
  const [text, setText] = useState(script?.text ?? '')
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const originalText = useRef(script?.text ?? '')
  const originalTitle = useRef(script?.title ?? '')

  const isDirty = text !== originalText.current || title !== originalTitle.current

  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 50) }, [])

  const handleSave = () => {
    if (!text.trim()) return
    onSave(title.trim() || 'Untitled', text.trim())
  }

  const handleClose = () => {
    if (isDirty && text.trim()) { setConfirmDiscard(true) }
    else { onClose() }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') {
      if (confirmDiscard) setConfirmDiscard(false)
      else handleClose()
    }
  }

  const wc = wordCount(text)
  const rt = readTime(text)

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          background: C.bgPanel, border: `1px solid ${C.border}`,
          borderRadius: 16, width: '100%', maxWidth: 720,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: C.textPrimary }}>
            {script ? 'Edit Script' : 'New Script'}
          </h2>
          <button onClick={handleClose} style={{
            background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', fontSize: 18, lineHeight: 1,
          }}>✕</button>
        </div>

        {confirmDiscard && (
          <div style={{
            background: C.warningBg, borderBottom: `1px solid ${C.warningBorder}`,
            padding: '10px 20px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 12,
          }}>
            <span style={{ fontSize: 13, color: C.warningText }}>You have unsaved changes.</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDiscard(false)} style={{
                background: C.bgCard, border: `1px solid ${C.border}`, color: C.textSecondary,
                padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
              }}>Keep editing</button>
              <button onClick={onClose} style={{
                background: C.dangerBg, border: `1px solid ${C.danger}`, color: C.dangerText,
                padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
              }}>Discard</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 16, gap: 10 }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Script title…"
            style={{
              background: C.bgInput, border: `1px solid ${C.border}`, color: C.textPrimary,
              padding: '8px 12px', borderRadius: 8, fontSize: 15, fontFamily: 'inherit',
              outline: 'none', width: '100%',
            }}
            onFocus={e => (e.target.style.borderColor = C.accent)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste or type your script here…"
            style={{
              flex: 1, minHeight: 300, background: C.bgInput, border: `1px solid ${C.border}`,
              color: C.textPrimary, padding: '12px', borderRadius: 8, fontSize: 15,
              fontFamily: 'inherit', resize: 'none', lineHeight: 1.7, outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = C.accent)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
          <p style={{ fontSize: 11, color: C.textMuted }}>
            {text.length.toLocaleString()} chars
            {wc > 0 && ` · ${wc.toLocaleString()} words`}
            {rt && ` · ${rt} read`}
            {` · ⌘S to save`}
          </p>
        </div>

        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button onClick={handleClose} style={{
            background: C.bgCard, border: `1px solid ${C.border}`, color: C.textSecondary,
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
          }}>Cancel</button>
          <button onClick={handleSave} disabled={!text.trim()} style={{
            background: text.trim() ? C.accent : C.bgHover,
            border: 'none',
            color: text.trim() ? C.accentText : C.textMuted,
            padding: '8px 20px', borderRadius: 8,
            cursor: text.trim() ? 'pointer' : 'default',
            fontSize: 13, fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.15s',
          }}>Save Script</button>
        </div>
      </div>
    </div>
  )
}
