'use client'

import { Script } from '@/lib/storage'
import { TeleprompterSettings } from '@/lib/useSettings'
import { getColors, RADIUS, MOTION } from '@/lib/theme'
import { useState, useEffect, useRef } from 'react'

// Small consistent line-icon set — replaces the emoji that used to stand in
// for these controls, matching the stroke style used in the teleprompter
// toolbar (IconArrowUp, IconTimer, etc.)
const IconList = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="1" y1="3" x2="13" y2="3" /><line x1="1" y1="7" x2="13" y2="7" /><line x1="1" y1="11" x2="13" y2="11" />
  </svg>
)
const IconSliders = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="2" y1="2" x2="2" y2="12" /><line x1="7" y1="2" x2="7" y2="12" /><line x1="12" y1="2" x2="12" y2="12" />
    <circle cx="2" cy="5" r="1.6" fill="currentColor" stroke="none" /><circle cx="7" cy="9" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="4" r="1.6" fill="currentColor" stroke="none" />
  </svg>
)
const IconFolder = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4.5a1 1 0 0 1 1-1h3.5l1.5 2H15a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
  </svg>
)
const IconCloud = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13.5h8a3 3 0 0 0 0-6 4.5 4.5 0 0 0-8.7-1.4A3.3 3.3 0 0 0 5 13.5z" />
  </svg>
)
const IconMoon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor"><path d="M12.5 8.7A5.7 5.7 0 0 1 5.3 1.5 5.7 5.7 0 1 0 12.5 8.7z" /></svg>
)
const IconSun = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <circle cx="7" cy="7" r="3" /><line x1="7" y1="0.5" x2="7" y2="2" /><line x1="7" y1="12" x2="7" y2="13.5" />
    <line x1="0.5" y1="7" x2="2" y2="7" /><line x1="12" y1="7" x2="13.5" y2="7" />
    <line x1="2.3" y1="2.3" x2="3.3" y2="3.3" /><line x1="10.7" y1="10.7" x2="11.7" y2="11.7" />
    <line x1="2.3" y1="11.7" x2="3.3" y2="10.7" /><line x1="10.7" y1="3.3" x2="11.7" y2="2.3" />
  </svg>
)

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
  onClose: () => void
  settings: TeleprompterSettings
  onSettingChange: (patch: Partial<TeleprompterSettings>) => void
}

export default function Sidebar({
  scripts, activeId, onSelect, onNew, onEdit, onDelete, onDuplicate,
  onImport, onGoogleDrive, onClose, settings, onSettingChange,
}: SidebarProps) {
  const C = getColors(settings.theme)
  const [tab, setTab] = useState<'scripts' | 'settings'>('scripts')

  return (
    <aside style={{
      width: 272,
      background: C.bgPanel,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header with segmented tab control + close button */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px 10px',
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <div style={{
          flex: 1, display: 'flex', gap: 2, padding: 3, borderRadius: RADIUS.pill,
          background: C.bgCard, border: `1px solid ${C.border}`,
        }}>
          {(['scripts', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '7px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: tab === t ? C.accent : 'transparent', border: 'none',
              color: tab === t ? C.accentText : C.textMuted, cursor: 'pointer',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.3px',
              borderRadius: RADIUS.pill,
              boxShadow: tab === t ? C.btnShadowAccent : 'none',
              transition: `all ${MOTION.base} ${MOTION.spring}`,
            }}>
              {t === 'scripts' ? <IconList /> : <IconSliders />}
              {t === 'scripts' ? 'Scripts' : 'Settings'}
            </button>
          ))}
        </div>
        {/* Close sidebar button */}
        <button
          onClick={onClose}
          title="Close sidebar"
          style={{
            width: 32, height: 32, background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: '50%',
            color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, transition: `all ${MOTION.fast} ${MOTION.out}`,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
          onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="11" y1="3" x2="5" y2="8" />
            <line x1="5" y1="8" x2="11" y2="13" />
          </svg>
        </button>
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
      onDelete(id); setPendingDelete(null)
    } else {
      setPendingDelete(id)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setPendingDelete(null), 3000)
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const filtered = search.trim()
    ? scripts.filter(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.text.toLowerCase().includes(search.toLowerCase()))
    : scripts

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Import row */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 7 }}>Import from</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <ImportBtn icon={<IconFolder />} label="File / Notes" onClick={onImport} C={C} />
          <ImportBtn icon={<IconCloud />} label="Google Drive" onClick={onGoogleDrive} C={C} />
        </div>
        <p style={{ fontSize: 10, color: C.textFaint, marginTop: 7, lineHeight: 1.5 }}>
          Apple Notes: export note as .txt from Share sheet
        </p>
      </div>

      {/* Search */}
      {scripts.length >= 4 && (
        <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}` }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search scripts…"
            style={{
              width: '100%', background: C.bgInput, border: `1px solid ${C.border}`,
              color: C.textPrimary, padding: '7px 10px', borderRadius: 8,
              fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = C.accent)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
        </div>
      )}

      {/* Script list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
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
                borderRadius: RADIUS.md, marginBottom: 8, cursor: 'pointer',
                transition: `all ${MOTION.base} ${MOTION.out}`, overflow: 'hidden',
                boxShadow: isActive ? `0 0 0 2px ${C.accent}22` : 'none',
              }}
            >
              {/* Card body */}
              <div style={{ padding: '9px 11px 7px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 3, lineHeight: 1.35 }}>
                  {s.title}
                </p>
                {isPending ? (
                  <p style={{ fontSize: 10, color: C.dangerText, fontWeight: 500 }}>Tap TRASH again to confirm · auto-cancels</p>
                ) : (
                  <p style={{ fontSize: 10, color: C.textMuted }}>
                    {wc.toLocaleString()} words{rt ? ` · ${rt}` : ''}
                  </p>
                )}
              </div>

              {/* Action row at bottom */}
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  display: 'flex', borderTop: `1px solid ${isPending ? C.danger : C.border}`,
                  background: isPending ? `${C.dangerBg}` : C.bgApp,
                }}
              >
                {/* EDIT */}
                <CardBtn
                  onClick={e => { e.stopPropagation(); setPendingDelete(null); onEdit(s.id) }}
                  flex={3}
                  C={C}
                  color={C.accent}
                >
                  EDIT
                </CardBtn>
                <div style={{ width: 1, background: isPending ? C.danger : C.border }} />
                {/* DUP */}
                <CardBtn
                  onClick={e => { e.stopPropagation(); setPendingDelete(null); onDuplicate(s.id) }}
                  flex={2.5}
                  C={C}
                  color={C.textSecondary}
                >
                  DUP
                </CardBtn>
                <div style={{ width: 1, background: isPending ? C.danger : C.border }} />
                {/* TRASH */}
                <CardBtn
                  onClick={e => requestDelete(s.id, e)}
                  flex={2}
                  C={C}
                  color={isPending ? C.dangerText : C.textMuted}
                  danger={isPending}
                >
                  {isPending ? '✕ CONFIRM' : 'TRASH'}
                </CardBtn>
              </div>
            </div>
          )
        })}
      </div>

      {/* New Script */}
      <div style={{ padding: '10px', borderTop: `1px solid ${C.border}` }}>
        <button onClick={onNew} style={{
          width: '100%', background: C.accent, border: 'none',
          color: C.accentText, padding: '11px', borderRadius: RADIUS.pill, cursor: 'pointer',
          fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
          boxShadow: C.btnShadowAccent, transition: `all ${MOTION.fast} ${MOTION.out}`,
          letterSpacing: '0.2px',
        }}
          onMouseDown={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseUp={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          + New Script
        </button>
      </div>
    </div>
  )
}

function CardBtn({ children, onClick, flex, C, color, danger }: {
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  flex: number
  C: ReturnType<typeof getColors>
  color: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex,
        background: 'none',
        border: 'none',
        padding: '7px 4px',
        cursor: 'pointer',
        fontSize: danger ? 10 : 10,
        fontWeight: 700,
        letterSpacing: '0.7px',
        color,
        fontFamily: 'system-ui, sans-serif',
        transition: 'opacity 0.12s',
        minHeight: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      {children}
    </button>
  )
}

function SettingsTab({ settings, onChange, C }: {
  settings: TeleprompterSettings,
  onChange: (p: Partial<TeleprompterSettings>) => void,
  C: ReturnType<typeof getColors>,
}) {
  const readColors = [
    { label: 'Default', value: C.defaultTextColor },
    { label: 'Amber', value: '#f5c842' },
    { label: 'Green', value: '#4ade80' },
    { label: 'Blue', value: '#60a5fa' },
  ]

  return (
    <div style={{ overflowY: 'auto', flex: 1, padding: '14px 12px' }}>

      <Section label="App Theme" C={C}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['dark', 'light'] as const).map(t => (
            <button
              key={t}
              onClick={() => onChange({ theme: t })}
              style={{
                flex: 1, padding: '9px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: settings.theme === t ? C.accent : C.bgCard,
                border: `1px solid ${settings.theme === t ? C.accentDim : C.border}`,
                color: settings.theme === t ? C.accentText : C.textSecondary,
                borderRadius: RADIUS.pill, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                fontWeight: settings.theme === t ? 700 : 500,
                boxShadow: settings.theme === t ? C.btnShadowAccent : C.btnShadow,
                transition: `all ${MOTION.base} ${MOTION.spring}`,
              }}
            >
              {t === 'dark' ? <IconMoon /> : <IconSun />}
              {t === 'dark' ? 'Dark' : 'Light'}
            </button>
          ))}
        </div>
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
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {readColors.map(c => (
            <button key={c.value} onClick={() => onChange({ textColor: c.value })} title={c.label}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                border: settings.textColor === c.value ? `2.5px solid ${C.accent}` : `2px solid ${C.border}`,
                background: c.value, cursor: 'pointer', transition: `all ${MOTION.fast} ${MOTION.spring}`,
                boxShadow: settings.textColor === c.value ? C.btnShadowAccent : C.btnShadow,
              }}
            />
          ))}
          <input type="color" value={settings.textColor} onChange={e => onChange({ textColor: e.target.value })}
            style={{ width: 30, height: 30, border: `2px solid ${C.border}`, borderRadius: '50%', cursor: 'pointer', background: 'none', padding: 0 }}
          />
        </div>
      </Section>

      <Section label="Text Alignment" C={C}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['left', 'center', 'right'] as const).map(a => (
            <button key={a} onClick={() => onChange({ textAlign: a })} style={{
              flex: 1, padding: '7px 0',
              background: settings.textAlign === a ? C.accent : C.bgCard,
              border: `1px solid ${settings.textAlign === a ? C.accentDim : C.border}`,
              color: settings.textAlign === a ? C.accentText : C.textSecondary,
              borderRadius: RADIUS.pill, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
              fontWeight: settings.textAlign === a ? 700 : 500,
              boxShadow: settings.textAlign === a ? C.btnShadowAccent : C.btnShadow,
              transition: `all ${MOTION.base} ${MOTION.spring}`,
            }}>
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Mirror Mode" C={C}>
        <ToggleRow label="Horizontal (reflector)" checked={settings.mirrorH} onChange={v => onChange({ mirrorH: v })} C={C} />
        <ToggleRow label="Vertical flip" checked={settings.mirrorV} onChange={v => onChange({ mirrorV: v })} C={C} />
        <p style={{ fontSize: 10, color: C.textFaint, marginTop: 4, lineHeight: 1.5 }}>
          Enable horizontal for glass beam-splitter reflectors
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
    <div style={{ marginBottom: 22 }}>
      <p style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 9 }}>{label}</p>
      {children}
    </div>
  )
}

function SliderRow({ min, max, step = 1, value, onChange, display, C }: {
  min: number, max: number, step?: number, value: number,
  onChange: (v: number) => void, display: string, C: ReturnType<typeof getColors>,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: C.accent, cursor: 'pointer' }}
      />
      <span style={{
        fontSize: 12, color: C.textPrimary, minWidth: 40, textAlign: 'right',
        fontVariantNumeric: 'tabular-nums', fontWeight: 500, fontFamily: 'system-ui, sans-serif',
      }}>{display}</span>
    </div>
  )
}

function ToggleRow({ label, checked, onChange, C }: {
  label: string, checked: boolean, onChange: (v: boolean) => void, C: ReturnType<typeof getColors>
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 12 }}>
      <span style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.3 }}>{label}</span>
      {/* Apple-style toggle */}
      <div
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        style={{
          width: 42, height: 26, borderRadius: RADIUS.pill,
          background: checked ? C.accent : C.bgHover,
          border: `1.5px solid ${checked ? C.accentDim : C.border}`,
          cursor: 'pointer', position: 'relative',
          transition: `background ${MOTION.base} ${MOTION.out}, border-color ${MOTION.base} ${MOTION.out}`,
          flexShrink: 0,
          boxShadow: checked ? `0 0 0 3px ${C.accent}22` : 'none',
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
          position: 'absolute', top: 2,
          left: checked ? 18 : 2,
          transition: `left ${MOTION.base} ${MOTION.spring}`,
        }} />
      </div>
    </div>
  )
}

function ImportBtn({ icon, label, onClick, C }: {
  icon: React.ReactNode, label: string, onClick: () => void, C: ReturnType<typeof getColors>
}) {
  return (
    <button onClick={onClick} style={{
      background: C.bgCard, border: `1px solid ${C.border}`, color: C.textPrimary,
      padding: '11px 4px', borderRadius: RADIUS.md, cursor: 'pointer', fontSize: 11,
      fontFamily: 'inherit', textAlign: 'center', display: 'flex',
      flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%',
      boxShadow: C.btnShadow, fontWeight: 500, transition: `background ${MOTION.fast} ${MOTION.out}`,
    }}
      onMouseEnter={e => (e.currentTarget.style.background = C.bgHover)}
      onMouseLeave={e => (e.currentTarget.style.background = C.bgCard)}
    >
      <span style={{ color: C.accent }}>{icon}</span>
      {label}
    </button>
  )
}
