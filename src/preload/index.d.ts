import { ElectronAPI } from "@electron-toolkit/preload"

interface SongResult {
  id: number
  title: string
  artist: string
  thumbnail: string
  url: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      lyrics: {
        search: (query: string) => Promise<SongResult[]>
        getLyrics: (artist: string, title: string) => Promise<string[]>
      }
      auth: {
        openGoogle: (url: string) => Promise<void>
        onCallback: (callback: (url: string) => void) => void
      }
    }
  }
}
