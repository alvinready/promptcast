'use client'

import { useEffect, useState } from 'react'
import { useGoogleDrive, DriveFile } from '@/lib/useGoogleDrive'
import { TeleprompterSettings } from '@/lib/useSettings'
import { getColors } from '@/lib/theme'

interface GoogleDriveModalProps {
  clientId: string | undefined
  settings: TeleprompterSettings
  onImport: (title: string, text: string) => void
  onClose: () => void
}

export default function GoogleDriveModal({ clientId, settings, onImport, onClose }: GoogleDriveModalProps) {
  const C = getColors(settings.theme)
  const { isReady, isSignedIn, error, signIn, signOut, listDocs, fetchDocText } = useGoogleDrive(clientId)
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)

  useEffect(() => { if (isSignedIn) loadFiles() }, [isSignedIn])

  const loadFiles = async () => {
    setLoading(true)
    setFetchError(null)
    try { setFiles(await listDocs()) }
    catch (e: unknown) { setFetchError(e instanceof Error ? e.message : 'Failed to load files') }
    finally { setLoading(false) }
  }

  const importFile = async (file: DriveFile) => {
    setImporting(file.id)
    try { onImport(file.name, await fetchDocText(file.id)) }
    catch (e: unknown) { setFetchError(e instanceof Error ? e.message : 'Import failed') }
    finally { setImporting(null) }
  }

  if (!clientId) {
    return (
      <ModalShell onClose={onClose} title="Google Drive" C={C}>
        <div style={{ padding: 20 }}>
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: '16px', fontSize: 13, color: C.textSecondary, lineHeight: 1.7,
          }}>
            <p style={{ color: C.textPrimary, fontWeight: 500, marginBottom: 8 }}>Setup required</p>
            <p>To enable Google Drive, add your OAuth Client ID to Vercel environment variables:</p>
            <code style={{
              display: 'block', background: C.bgInput, border: `1px solid ${C.border}`,
              borderRadius: 6, padding: '8px 12px', marginTop: 10, marginBottom: 10,
              color: C.accent, fontSize: 12,
            }}>
              NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
            </code>
            <p>Create a free OAuth Client at <b style={{ color: '#4285f4' }}>console.cloud.google.com</b></p>
            <p style={{ marginTop: 8 }}>Enable the <b>Google Drive API</b> and add your Vercel domain to authorized origins.</p>
          </div>
        </div>
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={onClose} title="Google Drive" C={C}>
      <div style={{ padding: 16 }}>
        {!isSignedIn ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📄</p>
            <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 16 }}>
              Sign in to browse your Google Docs
            </p>
            <button onClick={signIn} disabled={!isReady} style={{
              background: '#4285f4', border: 'none', color: '#fff',
              padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
              fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
              opacity: isReady ? 1 : 0.5,
            }}>
              Sign in with Google
            </button>
            {error && <p style={{ color: C.dangerText, fontSize: 12, marginTop: 12 }}>{error}</p>}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: C.textMuted }}>Your Google Docs</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <TinyBtn onClick={loadFiles} C={C}>↻ Refresh</TinyBtn>
                <TinyBtn onClick={signOut} C={C}>Sign out</TinyBtn>
              </div>
            </div>
            {loading && <p style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: 24 }}>Loading…</p>}
            {fetchError && <p style={{ color: C.dangerText, fontSize: 12 }}>{fetchError}</p>}
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {files.map(f => (
                <div key={f.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '10px 12px', marginBottom: 6,
                }}>
                  <p style={{ fontSize: 13, color: C.textPrimary, flex: 1 }}>📝 {f.name}</p>
                  <button onClick={() => importFile(f)} disabled={importing === f.id} style={{
                    background: C.accent, border: 'none', color: C.accentText,
                    padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                    fontSize: 12, fontFamily: 'inherit', fontWeight: 500,
                    opacity: importing === f.id ? 0.5 : 1,
                  }}>
                    {importing === f.id ? '…' : 'Import'}
                  </button>
                </div>
              ))}
              {!loading && files.length === 0 && (
                <p style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: 24 }}>No Google Docs found</p>
              )}
            </div>
          </>
        )}
      </div>
    </ModalShell>
  )
}

function TinyBtn({ children, onClick, C }: {
  children: React.ReactNode, onClick: () => void, C: ReturnType<typeof getColors>
}) {
  return (
    <button onClick={onClick} style={{
      background: C.bgCard, border: `1px solid ${C.border}`, color: C.textSecondary,
      padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
    }}>
      {children}
    </button>
  )
}

function ModalShell({ children, onClose, title, C }: {
  children: React.ReactNode, onClose: () => void, title: string, C: ReturnType<typeof getColors>
}) {
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
          <h2 style={{ fontSize: 16, fontWeight: 500, color: C.textPrimary }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
