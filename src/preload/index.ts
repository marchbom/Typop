import { contextBridge, ipcRenderer } from "electron"
import { electronAPI } from "@electron-toolkit/preload"

const api = {
  lyrics: {
    search: (query: string) => ipcRenderer.invoke("lyrics:search", query),
    getLyrics: (artist: string, title: string) => ipcRenderer.invoke("lyrics:getLyrics", artist, title)
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
  window.electron = electronAPI
  window.api = api
}
