'use client'

import { Script } from '@/lib/storage'
import { TeleprompterSettings } from '@/lib/useSettings'
import { getColors } from '@/lib/theme'
import { useState, useEffect, useRef } from 'react'

interface SidebarProps {
  scripts: Script[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onImport: () => void
  onGoogleDrive: () => void
  settings: TeleprompterSettings
  onSettingChange: (patch: Partial<TeleprompterSettings>) => void
}

export default function Sidebar({
  scripts, activeId, onSelect, onNew, onEdit, onDelete, onDuplicate,
  onImport, onGoogleDrive, settings, onSettingChange,
}: SidebarProps) {
  const C = getColors(settings.theme)
  const [tab, setTab] = useState<'scripts' | 'settings'>('scripts')

  return (
    <aside style={{
      width: 264,
      background: C.bgPanel,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
        {(['scripts', 'settings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px 0', background: 'none', border: 'none',
            color: tab === t ? C.accent : C.textMuted, cursor: 'pointer',
            fontSize: 12, fontWeight: 500, textTransform: 'uppercase',
            letterSpacing: '0.8px',
            borderBottom: tab === t ? `2px solid ${C.accent}` : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'scripts' ? (
        <ScriptsTab
          scripts={scripts} activeId={activeId} C={C}
          onSelect={onSelect} onNew={onNew} onEdit={onEdit}
          onDelete={onDelete} onDuplicate={onDuplicate}
          onImport={onImport} onGoogleDrive={onGoogleDrive}
        />
      ) : (
        <SettingsTab settings={settings} onChange={onSettingChange} C={C} />
      )}
    </aside>
  )
}

function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length
}

function readTime(text: string): string {
  const words = wordCount(text)
  if (words === 0) return ''
  const totalSecs = Math.round((words / 140) * 60)
  if (totalSecs < 60) return `~${totalSecs}s`
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return s === 0 ? `~${m}m` : `~${m}m ${s}s`
}

function ScriptsTab({ scripts, activeId, onSelect, onNew, onEdit, onDelete, onDuplicate, onImport, onGoogleDrive, C }: {
  scripts: Script[], activeId: string | null, C: ReturnType<typeof getColors>,
  onSelect: (id: string) => void, onNew: () => void, onEdit: (id: string) => void,
  onDelete: (id: string) => void, onDuplicate: (id: string) => void,
  onImport: () => void, onGoogleDrive: () => void,
}) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const requestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (pendingDelete === id) {
      onDelete(id)
      setPendingDelete(null)
    } else {
      setPendingDelete(id)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setPendingDelete(null), 3000)
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const filtered = search.trim()
    ? scripts.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.text.toLowerCase().includes(search.toLowerCase())
      )
    : scripts

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ padding: '12px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
          Import from
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <ImportBtn icon="📁" label="File / Notes" onClick={onImport} C={C} />
          <ImportBtn icon="📄" label="Google Drive" onClick={onGoogleDrive} C={C} />
        </div>
        <p style={{ fontSize: 10, color: C.textFaint, marginTop: 8, lineHeight: 1.5 }}>
          Apple Notes: export note as .txt from Share sheet
        </p>
      </div>

      {scripts.length >= 4 && (
        <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}` }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search scripts…"
            style={{
              width: '100%', background: C.bgInput, border: `1px solid ${C.border}`,
              color: C.textPrimary, padding: '6px 10px', borderRadius: 7,
              fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = C.accent)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {filtered.length === 0 && (
          <p style={{ color: C.textFaint, fontSize: 12, textAlign: 'center', marginTop: 24 }}>
            {search ? 'No matches' : 'No scripts yet'}
          </p>
        )}
        {filtered.map(s => {
          const isActive = activeId === s.id
          const isPending = pendingDelete === s.id
          const wc = wordCount(s.text)
          const rt = readTime(s.text)

          return (
            <div
              key={s.id}
              onClick={() => { setPendingDelete(null); onSelect(s.id) }}
              style={{
                background: isPending ? C.dangerBg : isActive ? C.accentBg : C.bgCard,
                border: `1px solid ${isPending ? C.danger : isActive ? C.accent : C.border}`,
                borderRadius: 8, padding: '8px 10px', marginBottom: 6, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary, marginBottom: 2, flex: 1, lineHeight: 1.4 }}>
                  {s.title}
                </p>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <ActionBtn title="Edit" onClick={e => { e.stopPropagation(); setPendingDelete(null); onEdit(s.id) }} C={C}>✏️</ActionBtn>
                  <ActionBtn title="Duplicate" onClick={e => { e.stopPropagation(); setPendingDelete(null); onDuplicate(s.id) }} C={C}>⎘</ActionBtn>
                  <ActionBtn title={isPending ? 'Tap again to confirm delete' : 'Delete'} onClick={e => requestDelete(s.id, e)} C={C} danger={isPending}>
                    {isPending ? '✕' : '🗑'}
                  </ActionBtn>
                </div>
              </div>
              {isPending ? (
                <p style={{ fontSize: 10, color: C.dangerText, marginTop: 2 }}>
                  Tap delete again to confirm · auto-cancels
                </p>
              ) : (
                <p style={{ fontSize: 10, color: C.textMuted }}>
                  {wc.toLocaleString()} words{rt ? ` · ${rt}` : ''}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '10px', borderTop: `1px solid ${C.border}` }}>
        <button onClick={onNew} style={{
          width: '100%', background: C.bgCard, border: `1px solid ${C.border}`,
          color: C.textPrimary, padding: '8px', borderRadius: 8, cursor: 'pointer',
          fontSize: 12, fontFamily: 'inherit',
        }}>
          + New Script
        </button>
      </div>
    </div>
  )
}

function SettingsTab({ settings, onChange, C }: {
  settings: TeleprompterSettings,
  onChange: (p: Partial<TeleprompterSettings>) => void,
  C: ReturnType<typeof getColors>,
}) {
  const readColors = [
    { label: 'Default', value: settings.theme === 'light' ? '#1c1814' : '#f0ede8' },
    { label: 'Amber', value: '#f5c842' },
    { label: 'Green', value: '#7dd3a8' },
    { label: 'Blue', value: '#93c5fd' },
  ]

  return (
    <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>

      {/* Theme toggle — first thing in settings */}
      <Section label="App Theme" C={C}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['dark', 'light'] as const).map(t => (
            <button
              key={t}
              onClick={() => onChange({ theme: t })}
              style={{
                flex: 1, padding: '8px 0',
                background: settings.theme === t ? C.accent : C.bgCard,
                border: `1px solid ${settings.theme === t ? C.accent : C.border}`,
                color: settings.theme === t ? C.accentText : C.textSecondary,
                borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                fontWeight: settings.theme === t ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 10, color: C.textFaint, marginTop: 6, lineHeight: 1.5 }}>
          Light mode uses warm parchment tones, easy on the eyes.
        </p>
      </Section>

      <Section label="Font Size" C={C}>
        <SliderRow min={18} max={80} value={settings.fontSize}
          onChange={v => onChange({ fontSize: v })} display={`${settings.fontSize}px`} C={C} />
      </Section>

      <Section label="Line Height" C={C}>
        <SliderRow min={1.2} max={3} step={0.1} value={settings.lineHeight}
          onChange={v => onChange({ lineHeight: v })} display={settings.lineHeight.toFixed(1)} C={C} />
      </Section>

      <Section label="Side Padding" C={C}>
        <SliderRow min={20} max={200} value={settings.padding}
          onChange={v => onChange({ padding: v })} display={`${settings.padding}px`} C={C} />
      </Section>

      <Section label="Script Text Color" C={C}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {readColors.map(c => (
            <button key={c.value} onClick={() => onChange({ textColor: c.value })} title={c.label}
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: settings.textColor === c.value ? `2px solid ${C.accent}` : `2px solid ${C.border}`,
                background: c.value, cursor: 'pointer',
              }}
            />
          ))}
          <input type="color" value={settings.textColor} onChange={e => onChange({ textColor: e.target.value })}
            style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none', padding: 0 }}
          />
        </div>
      </Section>

      <Section label="Text Alignment" C={C}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['left', 'center', 'right'] as const).map(a => (
            <button key={a} onClick={() => onChange({ textAlign: a })} style={{
              flex: 1, padding: '5px 0',
              background: settings.textAlign === a ? C.accent : C.bgCard,
              border: `1px solid ${C.border}`,
              color: settings.textAlign === a ? C.accentText : C.textSecondary,
              borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
            }}>
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Mirror Mode" C={C}>
        <ToggleRow label="Horizontal (reflector)" checked={settings.mirrorH} onChange={v => onChange({ mirrorH: v })} C={C} />
        <ToggleRow label="Vertical flip" checked={settings.mirrorV} onChange={v => onChange({ mirrorV: v })} C={C} />
        <p style={{ fontSize: 10, color: C.textFaint, marginTop: 6, lineHeight: 1.5 }}>
          Enable horizontal for glass beam-splitter teleprompter reflectors
        </p>
      </Section>

      <Section label="Display" C={C}>
        <ToggleRow label="Center guide line" checked={settings.showCenterLine} onChange={v => onChange({ showCenterLine: v })} C={C} />
        <ToggleRow label="Dark reading area" checked={settings.darkBg} onChange={v => onChange({ darkBg: v })} C={C} />
      </Section>
    </div>
  )
}

function Section({ label, children, C }: { label: string, children: React.ReactNode, C: ReturnType<typeof getColors> }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>{label}</p>
      {children}
    </div>
  )
}

function SliderRow({ min, max, step = 1, value, onChange, display, C }: {
  min: number, max: number, step?: number, value: number,
  onChange: (v: number) => void, display: string, C: ReturnType<typeof getColors>,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: C.accent }}
      />
      <span style={{ fontSize: 11, color: C.textSecondary, minWidth: 34, textAlign: 'right' }}>{display}</span>
    </div>
  )
}

function ToggleRow({ label, checked, onChange, C }: {
  label: string, checked: boolean, onChange: (v: boolean) => void, C: ReturnType<typeof getColors>
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: C.textSecondary }}>{label}</span>
      <div onClick={() => onChange(!checked)} style={{
        width: 36, height: 20, borderRadius: 10, background: checked ? C.accent : C.bgHover,
        cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          background: checked ? C.accentText : C.textSecondary,
          position: 'absolute', top: 3,
          left: checked ? 19 : 3, transition: 'left 0.2s',
        }} />
      </div>
    </div>
  )
}

function ImportBtn({ icon, label, onClick, C }: {
  icon: string, label: string, onClick: () => void, C: ReturnType<typeof getColors>
}) {
  return (
    <button onClick={onClick} style={{
      background: C.bgCard, border: `1px solid ${C.border}`, color: C.textPrimary,
      padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 11,
      fontFamily: 'inherit', textAlign: 'center', display: 'flex',
      flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%',
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </button>
  )
}

function ActionBtn({ children, onClick, title, danger, C }: {
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  title?: string
  danger?: boolean
  C: ReturnType<typeof getColors>
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: danger ? C.dangerBg : 'none',
        border: danger ? `1px solid ${C.danger}` : 'none',
        cursor: 'pointer',
        padding: '4px 6px',
        borderRadius: 5,
        fontSize: 13,
        lineHeight: 1,
        minWidth: 26,
        minHeight: 26,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: danger ? 1 : 0.45,
        transition: 'opacity 0.15s, background 0.15s',
        color: danger ? C.dangerText : undefined,
        fontWeight: danger ? 700 : undefined,
      }}
      onMouseEnter={e => { if (!danger) e.currentTarget.style.opacity = '1' }}
      onMouseLeave={e => { if (!danger) e.currentTarget.style.opacity = '0.45' }}
    >
      {children}
    </button>
  )
}
