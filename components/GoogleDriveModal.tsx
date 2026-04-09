'use client'

import { useEffect, useState } from 'react'
import { useGoogleDrive, DriveFile } from '@/lib/useGoogleDrive'

interface GoogleDriveModalProps {
  clientId: string | undefined
  onImport: (title: string, text: string) => void
  onClose: () => void
}

export default function GoogleDriveModal({ clientId, onImport, onClose }: GoogleDriveModalProps) {
  const { isReady, isSignedIn, error, signIn, signOut, listDocs, fetchDocText } = useGoogleDrive(clientId)
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)

  useEffect(() => {
    if (isSignedIn) loadFiles()
  }, [isSignedIn])

  const loadFiles = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const result = await listDocs()
      setFiles(result)
    } catch (e: any) {
      setFetchError(e.message ?? 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const importFile = async (file: DriveFile) => {
    setImporting(file.id)
    try {
      const text = await fetchDocText(file.id)
      onImport(file.name, text)
    } catch (e: any) {
      setFetchError(e.message ?? 'Import failed')
    } finally {
      setImporting(null)
    }
  }

  if (!clientId) {
    return (
      <ModalShell onClose={onClose} title="Google Drive">
        <div style={{ padding: 20 }}>
          <div style={{
            background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 10,
            padding: '16px', fontSize: 13, color: '#888', lineHeight: 1.7,
          }}>
            <p style={{ color: '#f0ede8', fontWeight: 500, marginBottom: 8 }}>Setup required</p>
            <p>To enable Google Drive, set your Google OAuth Client ID in your environment:</p>
            <code style={{
              display: 'block', background: '#141414', border: '1px solid #333',
              borderRadius: 6, padding: '8px 12px', marginTop: 10, marginBottom: 10,
              color: '#f5c842', fontSize: 12,
            }}>
              NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
            </code>
            <p>Create a free OAuth Client at <b style={{ color: '#93c5fd' }}>console.cloud.google.com</b></p>
            <p style={{ marginTop: 8 }}>Enable the <b>Google Drive API</b> and add your Vercel domain to authorized origins.</p>
          </div>
        </div>
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={onClose} title="Google Drive">
      <div style={{ padding: 16 }}>
        {!isSignedIn ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📄</p>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
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
            {error && <p style={{ color: '#e24b4a', fontSize: 12, marginTop: 12 }}>{error}</p>}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#666' }}>Your Google Docs</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={loadFiles} style={tinyBtnStyle}>↻ Refresh</button>
                <button onClick={signOut} style={tinyBtnStyle}>Sign out</button>
              </div>
            </div>
            {loading && <p style={{ color: '#666', fontSize: 13, textAlign: 'center', padding: 24 }}>Loading…</p>}
            {fetchError && <p style={{ color: '#e24b4a', fontSize: 12 }}>{fetchError}</p>}
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {files.map(f => (
                <div key={f.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8,
                  padding: '10px 12px', marginBottom: 6,
                }}>
                  <p style={{ fontSize: 13, color: '#f0ede8', flex: 1 }}>📝 {f.name}</p>
                  <button onClick={() => importFile(f)} disabled={importing === f.id} style={{
                    background: '#f5c842', border: 'none', color: '#000',
                    padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                    fontSize: 12, fontFamily: 'inherit', fontWeight: 500,
                    opacity: importing === f.id ? 0.5 : 1,
                  }}>
                    {importing === f.id ? '…' : 'Import'}
                  </button>
                </div>
              ))}
              {!loading && files.length === 0 && (
                <p style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: 24 }}>No Google Docs found</p>
              )}
            </div>
          </>
        )}
      </div>
    </ModalShell>
  )
}

const tinyBtnStyle: React.CSSProperties = {
  background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#888',
  padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
}

function ModalShell({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title: string }) {
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
          <h2 style={{ fontSize: 16, fontWeight: 500, color: '#f0ede8' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
