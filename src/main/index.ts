import { app, shell, BrowserWindow, ipcMain, dialog } from "electron"
import { join, resolve } from "path"
import { electronApp, optimizer, is } from "@electron-toolkit/utils"
import icon from "../../resources/icon.png?asset"
import axios from "axios"
import { autoUpdater } from "electron-updater"

function setupAutoUpdater(): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox({
        type: "info",
        title: "업데이트 완료",
        message: "새 버전이 다운로드됐습니다. 지금 재시작할까요?",
        buttons: ["재시작", "나중에"]
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      })
  })

  autoUpdater.checkForUpdates().catch(() => {})
}

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

  // 네이버 뉴스 헤드라인
  ipcMain.handle("speed:getNews", async () => {
    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID as string
    const clientSecret = import.meta.env.VITE_NAVER_CLIENT_SECRET as string
    const res = await axios.get("https://openapi.naver.com/v1/search/news.json", {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret
      },
      params: { query: "오늘", display: 30, sort: "date" }
    })
    const clean = (title: string): string =>
      title
        .replace(/<[^>]+>/g, "")
        .replace(/&[a-z]+;/gi, "")
        .replace(/\[.*?\]/g, "")
        .replace(/…/g, " ")
        .replace(/[^\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F\w\s,.!?'"()·]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim()
    return res.data.items
      .map((item: { title: string }) => clean(item.title))
      .filter((t: string) => t.length > 5)
  })

  createWindow()

  if (!is.dev) setupAutoUpdater()

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
