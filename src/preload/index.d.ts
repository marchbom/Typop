import { ElectronAPI } from "@electron-toolkit/preload"

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      speed: {
        getNews: () => Promise<string[]>
      }
      auth: {
        openGoogle: (url: string) => Promise<void>
        onCallback: (callback: (url: string) => void) => void
      }
    }
  }
}
