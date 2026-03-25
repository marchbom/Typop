import { contextBridge, ipcRenderer } from "electron"
import { electronAPI } from "@electron-toolkit/preload"

const api = {
  speed: {
    getNews: () => ipcRenderer.invoke("speed:getNews")
  },
  auth: {
    openGoogle: (url: string) => ipcRenderer.invoke("auth:openGoogle", url),
    onCallback: (callback: (url: string) => void) => {
      ipcRenderer.on("auth:callback", (_, url: string) => callback(url))
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI)
    contextBridge.exposeInMainWorld("api", api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (defined in index.d.ts)
  window.electron = electronAPI
  // @ts-expect-error (defined in index.d.ts)
  window.api = api
}
