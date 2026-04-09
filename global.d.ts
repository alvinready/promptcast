export {}

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
    gapi: {
      load: (lib: string, cb: () => void) => void
      client: {
        init: (config: object) => Promise<void>
        drive: {
          files: {
            list: (params: object) => Promise<{
              result: { files: Array<{ id: string; name: string; mimeType: string }> }
            }>
            export: (params: object) => Promise<{ body: string }>
            get: (params: object) => Promise<{ body: string }>
          }
        }
      }
      auth2: {
        getAuthInstance: () => {
          isSignedIn: { get: () => boolean }
          signIn: () => Promise<void>
          currentUser: { get: () => { getBasicProfile: () => { getName: () => string } } }
        }
      }
    }
  }
}
