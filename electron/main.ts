/**
 * 水镜进化 - Electron 主进程
 */
import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { startServer } from './server/index'

let mainWindow: BrowserWindow | null = null

const isDev = !app.isPackaged

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 880,
    minWidth: 400,
    minHeight: 700,
    title: '水镜进化',
    backgroundColor: '#FAF8F3',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // 开发模式加载 Vite dev server，生产模式加载内嵌 Express 服务器
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    // 生产模式通过 Express 服务器加载（避免 file:// 协议问题）
    mainWindow.loadURL('http://localhost:8787')
  }

  // 外部链接在浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  // 启动内嵌 Express 服务器
  await startServer()
  await createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
