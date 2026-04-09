'use client'

import { useEffect, useRef, useState } from 'react'

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'

export interface DriveFile {
  id: string
  name: string
  mimeType: string
}

export function useGoogleDrive(clientId: string | undefined) {
  const [isReady, setIsReady] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null)
  const accessTokenRef = useRef<string | null>(null)

  useEffect(() => {
    if (!clientId) return

    // Load gapi
    const gapiScript = document.createElement('script')
    gapiScript.src = 'https://apis.google.com/js/api.js'
    gapiScript.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
          })
          setIsReady(true)
        } catch (e) {
          setError('Failed to initialize Google API client.')
        }
      })
    }
    document.head.appendChild(gapiScript)

    // Load GIS
    const gisScript = document.createElement('script')
    gisScript.src = 'https://accounts.google.com/gsi/client'
    gisScript.onload = () => {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: response => {
          if (response.error) {
            setError('Google sign-in failed: ' + response.error)
            return
          }
          if (response.access_token) {
            accessTokenRef.current = response.access_token
            setIsSignedIn(true)
          }
        },
      })
    }
    document.head.appendChild(gisScript)

    return () => {
      document.head.removeChild(gapiScript)
      document.head.removeChild(gisScript)
    }
  }, [clientId])

  const signIn = () => {
    tokenClientRef.current?.requestAccessToken()
  }

  const signOut = () => {
    accessTokenRef.current = null
    setIsSignedIn(false)
  }

  const listDocs = async (): Promise<DriveFile[]> => {
    if (!accessTokenRef.current) throw new Error('Not signed in')
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document'&fields=files(id,name,mimeType)&pageSize=50`,
      { headers: { Authorization: `Bearer ${accessTokenRef.current}` } }
    )
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    return data.files ?? []
  }

  const fetchDocText = async (fileId: string): Promise<string> => {
    if (!accessTokenRef.current) throw new Error('Not signed in')
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
      { headers: { Authorization: `Bearer ${accessTokenRef.current}` } }
    )
    if (!res.ok) throw new Error('Failed to fetch document')
    return res.text()
  }

  return { isReady, isSignedIn, error, signIn, signOut, listDocs, fetchDocText }
}
