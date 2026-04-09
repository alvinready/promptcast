'use client'

import { Script, deleteScript } from '@/lib/storage'
import { TeleprompterSettings } from '@/lib/useSettings'
import { useState } from 'react'

interface SidebarProps {
  scripts: Script[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onImport: () => void
  onGoogleDrive: () => void
  settings: TeleprompterSettings
  onSettingChange: (patch: Partial<TeleprompterSettings>) => void
}

export default function Sidebar({
  scripts, activeId, onSelect, onNew, onEdit, onDelete,
  onImport, onGoogleDrive, settings, onSettingChange,
}: SidebarProps) {
  const [tab, setTab] = useState<'scripts' | 'settings'>('scripts')

  return (
    <aside style={{
      width: 264,
      background: '#141414',
      borderRight: '1px solid #2a2a2a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a' }}>
        {(['scripts', 'settings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px 0', background: 'none', border: 'none',
            color: tab === t ? '#f5c842' : '#666', cursor: 'pointer',
            fontSize: 12, fontWeight: 500, textTransform: 'uppercase',
            letterSpacing: '0.8px', borderBottom: tab === t ? '2px solid #f5c842' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'scripts' ? (
        <ScriptsTab
          scripts={scripts} activeId={activeId}
          onSelect={onSelect} onNew={onNew} onEdit={onEdit} onDelete={onDelete}
          onImport={onImport} onGoogleDrive={onGoogleDrive}
        />
      ) : (
        <SettingsTab settings={settings} onChange={onSettingChange} />
      )}
    </aside>
  )
}

function ScriptsTab({ scripts, activeId, onSelect, onNew, onEdit, onDelete, onImport, onGoogleDrive }: {
  scripts: Script[], activeId: string | null,
  onSelect: (id: string) => void, onNew: () => void, onEdit: (id: string) => void,
  onDelete: (id: string) => void, onImport: () => void, onGoogleDrive: () => void,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Import buttons */}
      <div style={{ padding: '12px', borderBottom: '1px solid #2a2a2a' }}>
        <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Import from</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <ImportBtn icon="📁" label="File / Notes" onClick={onImport} />
          <ImportBtn icon="📄" label="Google Drive" onClick={onGoogleDrive} />
        </div>
        <p style={{ fontSize: 10, color: '#444', marginTop: 8, lineHeight: 1.5 }}>
          Apple Notes: export note as .txt from Share sheet
        </p>
      </div>

      {/* Script list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {scripts.length === 0 && (
          <p style={{ color: '#444', fontSize: 12, textAlign: 'center', marginTop: 24 }}>No scripts yet</p>
        )}
        {scripts.map(s => (
          <div key={s.id} onClick={() => onSelect(s.id)} style={{
            background: activeId === s.id ? '#1e1a00' : '#1e1e1e',
            border: `1px solid ${activeId === s.id ? '#f5c842' : '#2a2a2a'}`,
            borderRadius: 8, padding: '8px 10px', marginBottom: 6, cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#f0ede8', marginBottom: 2, flex: 1, lineHeight: 1.4 }}>
                {s.title}
              </p>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <TinyBtn onClick={e => { e.stopPropagation(); onEdit(s.id) }}>✏️</TinyBtn>
                <TinyBtn onClick={e => { e.stopPropagation(); if (confirm('Delete this script?')) onDelete(s.id) }}>🗑</TinyBtn>
              </div>
            </div>
            <p style={{ fontSize: 10, color: '#555' }}>{s.text.length.toLocaleString()} chars</p>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px', borderTop: '1px solid #2a2a2a' }}>
        <button onClick={onNew} style={{
          width: '100%', background: '#1e1e1e', border: '1px solid #2a2a2a',
          color: '#f0ede8', padding: '8px', borderRadius: 8, cursor: 'pointer',
          fontSize: 12, fontFamily: 'inherit',
        }}>
          + New Script
        </button>
      </div>
    </div>
  )
}

function SettingsTab({ settings, onChange }: {
  settings: TeleprompterSettings,
  onChange: (p: Partial<TeleprompterSettings>) => void,
}) {
  const colors = [
    { label: 'White', value: '#f0ede8' },
    { label: 'Amber', value: '#f5c842' },
    { label: 'Green', value: '#7dd3a8' },
    { label: 'Blue', value: '#93c5fd' },
  ]

  return (
    <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
      <Section label="Font Size">
        <SliderRow
          min={18} max={80} value={settings.fontSize}
          onChange={v => onChange({ fontSize: v })}
          display={`${settings.fontSize}px`}
        />
      </Section>

      <Section label="Line Height">
        <SliderRow
          min={1.2} max={3} step={0.1} value={settings.lineHeight}
          onChange={v => onChange({ lineHeight: v })}
          display={settings.lineHeight.toFixed(1)}
        />
      </Section>

      <Section label="Side Padding">
        <SliderRow
          min={20} max={200} value={settings.padding}
          onChange={v => onChange({ padding: v })}
          display={`${settings.padding}px`}
        />
      </Section>

      <Section label="Text Color">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {colors.map(c => (
            <button key={c.value} onClick={() => onChange({ textColor: c.value })} title={c.label}
              style={{
                width: 28, height: 28, borderRadius: 6, border: settings.textColor === c.value ? '2px solid #f5c842' : '2px solid #333',
                background: c.value, cursor: 'pointer',
              }}
            />
          ))}
          <input type="color" value={settings.textColor} onChange={e => onChange({ textColor: e.target.value })}
            style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none', padding: 0 }}
          />
        </div>
      </Section>

      <Section label="Text Alignment">
        <div style={{ display: 'flex', gap: 4 }}>
          {(['left', 'center', 'right'] as const).map(a => (
            <button key={a} onClick={() => onChange({ textAlign: a })} style={{
              flex: 1, padding: '5px 0', background: settings.textAlign === a ? '#f5c842' : '#1e1e1e',
              border: '1px solid #2a2a2a', color: settings.textAlign === a ? '#000' : '#888',
              borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
            }}>
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Mirror Mode">
        <ToggleRow label="Horizontal (reflector)" checked={settings.mirrorH} onChange={v => onChange({ mirrorH: v })} />
        <ToggleRow label="Vertical flip" checked={settings.mirrorV} onChange={v => onChange({ mirrorV: v })} />
        <p style={{ fontSize: 10, color: '#444', marginTop: 6, lineHeight: 1.5 }}>
          Enable horizontal for glass beam-splitter teleprompter reflectors
        </p>
      </Section>

      <Section label="Display">
        <ToggleRow label="Center guide line" checked={settings.showCenterLine} onChange={v => onChange({ showCenterLine: v })} />
        <ToggleRow label="Dark background" checked={settings.darkBg} onChange={v => onChange({ darkBg: v })} />
      </Section>
    </div>
  )
}

function Section({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>{label}</p>
      {children}
    </div>
  )
}

function SliderRow({ min, max, step = 1, value, onChange, display }: {
  min: number, max: number, step?: number, value: number,
  onChange: (v: number) => void, display: string,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: '#f5c842' }}
      />
      <span style={{ fontSize: 11, color: '#888', minWidth: 34, textAlign: 'right' }}>{display}</span>
    </div>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
      <div onClick={() => onChange(!checked)} style={{
        width: 36, height: 20, borderRadius: 10, background: checked ? '#f5c842' : '#333',
        cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          background: checked ? '#000' : '#666',
          position: 'absolute', top: 3,
          left: checked ? 19 : 3, transition: 'left 0.2s',
        }} />
      </div>
    </div>
  )
}

function ImportBtn({ icon, label, onClick }: { icon: string, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#f0ede8',
      padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 11,
      fontFamily: 'inherit', textAlign: 'center', display: 'flex',
      flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%',
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </button>
  )
}

function TinyBtn({ children, onClick }: { children: React.ReactNode, onClick: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '2px 3px', borderRadius: 4, fontSize: 12, lineHeight: 1,
      opacity: 0.5, transition: 'opacity 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
    >
      {children}
    </button>
  )
}
