import { app, shell, BrowserWindow, ipcMain } from "electron"
import { join, resolve } from "path"
import { electronApp, optimizer, is } from "@electron-toolkit/utils"
import icon from "../../resources/icon.png?asset"
import axios from "axios"

const PROTOCOL = "typop"

// macOS 개발 모드에서는 execPath + argv[1] 을 함께 전달해야 프로토콜 등록됨
if (is.dev) {
  app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [resolve(process.argv[1])])
} else {
  app.setAsDefaultProtocolClient(PROTOCOL)
}

// Windows: 싱글 인스턴스 잠금 (두 번째 인스턴스에서 URL 받기)
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

let mainWindow: BrowserWindow | null = null

function handleAuthUrl(url: string): void {
  if (url.startsWith(`${PROTOCOL}://`) && mainWindow) {
    mainWindow.webContents.send("auth:callback", url)
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
}

// Windows: 두 번째 인스턴스 실행 시 URL 전달
app.on("second-instance", (_, argv) => {
  const url = argv.find((arg) => arg.startsWith(`${PROTOCOL}://`))
  if (url) handleAuthUrl(url)
})

// macOS: open-url 이벤트
app.on("open-url", (event, url) => {
  event.preventDefault()
  handleAuthUrl(url)
})

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  })

  mainWindow.on("ready-to-show", () => {
    mainWindow!.show()
    if (is.dev) mainWindow!.webContents.openDevTools()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"])
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron")

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Google OAuth URL을 외부 브라우저에서 열기
  ipcMain.handle("auth:openGoogle", async (_, url: string) => {
    await shell.openExternal(url)
  })

  // lyrics.ovh suggest 검색 (한글 포함 결과 제외)
  const koreanRegex = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/
  ipcMain.handle("lyrics:search", async (_, query: string) => {
    const res = await axios.get(`https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`)
    return res.data.data
      .filter(
        (item: { title: string; artist: { name: string } }) =>
          !koreanRegex.test(item.title) && !koreanRegex.test(item.artist.name)
      )
      .map(
        (item: {
          id: number
          title: string
          artist: { name: string }
          album: { cover_small: string }
        }) => ({
          id: item.id,
          title: item.title,
          artist: item.artist.name,
          thumbnail: item.album.cover_small,
          url: ""
        })
      )
  })

  // lyrics.ovh 가사 로딩
  ipcMain.handle("lyrics:getLyrics", async (_, artist: string, title: string) => {
    const res = await axios.get(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    )
    const lyrics: string = res.data.lyrics
    if (!lyrics) return []

    return lyrics
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("["))
  })

  createWindow()

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
