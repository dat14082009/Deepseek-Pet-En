// Electron Main Process - Anime Chibi Desktop Overlay
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, Notification } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn, execSync } = require('child_process')
const os = require('os')

// Local data directory for credentials and persistent state
const DATA_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'DeepSeekWhaleStandalone'
)
fs.mkdirSync(DATA_DIR, { recursive: true })

app.setName('DeepSeekWhaleStandalone')
app.setPath('userData', path.join(DATA_DIR, 'UserData'))

const LOG_FILE = path.join(DATA_DIR, 'overlay.log')
function log(msg) {
  try {
    const line = `[${new Date().toISOString()}] ${msg}\n`
    fs.appendFileSync(LOG_FILE, line, 'utf8')
  } catch {}
}

const STARTUP_SHORTCUT = path.join(
  process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
  'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup',
  'DeepSeek Chibi Overlay.lnk'
)

function isAutoStartEnabled() {
  return fs.existsSync(STARTUP_SHORTCUT)
}

function setAutoStart(enable) {
  try {
    if (enable) {
      const targetExe = path.join(__dirname, 'DeepSeekWhaleWidget.exe')
      const iconPath = path.join(__dirname, 'tray-icon.ico')
      const psScript = `
        $ws = New-Object -ComObject WScript.Shell
        $sc = $ws.CreateShortcut('${STARTUP_SHORTCUT.replace(/'/g, "''")}')
        $sc.TargetPath = '${targetExe.replace(/'/g, "''")}'
        $sc.WorkingDirectory = '${__dirname.replace(/'/g, "''")}'
        $sc.IconLocation = '${iconPath.replace(/'/g, "''")}'
        $sc.Description = 'DeepSeek Anime Chibi Desktop Overlay'
        $sc.Save()
      `
      execSync(`powershell -NoProfile -Command "${psScript.replace(/\r?\n/g, ' ')}"`, { stdio: 'ignore' })
      log('Auto-start enabled (created Startup shortcut)')
    } else {
      if (fs.existsSync(STARTUP_SHORTCUT)) {
        fs.unlinkSync(STARTUP_SHORTCUT)
        log('Auto-start disabled (removed Startup shortcut)')
      }
    }
  } catch (err) {
    log(`Auto-start error: ${err.message}`)
  }
}

let mainWindow = null
let tray = null
let serverProcess = null
let serverPort = 0

log('Application starting')

// ── Start backend plugin server (ESM) via child process ─────────────────────────
function startBackendServer() {
  return new Promise((resolve, reject) => {
    const runtimeNode = path.join(__dirname, 'runtime', 'node.exe')
    const nodeExe = fs.existsSync(runtimeNode) ? runtimeNode : 'node'
    log(`Spawning server with node: ${nodeExe}`)

    const child = spawn(nodeExe, ['server.mjs'], {
      cwd: __dirname,
      env: {
        ...process.env,
        DSHW_PORT: '0',
        DSH_HOME: DATA_DIR,
        DSHW_OVERLAY: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let resolved = false

    child.stdout.on('data', (data) => {
      const text = data.toString()
      for (const line of text.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue
        try {
          const parsed = JSON.parse(trimmed)
          if (parsed && parsed.ok && parsed.port) {
            serverPort = parsed.port
            log(`Server ready on port ${serverPort}`)
            resolved = true
            resolve(child)
            return
          }
        } catch {}
      }
    })

    child.stderr.on('data', (data) => {
      log(`Server STDERR: ${data.toString().trim()}`)
    })

    child.on('error', (err) => {
      log(`Server process error: ${err.message}`)
      if (!resolved) {
        resolved = true
        reject(err)
      }
    })

    child.on('exit', (code) => {
      log(`Server process exited with code ${code}`)
      if (!resolved) {
        resolved = true
        reject(new Error(`Plugin server exited prematurely with code ${code}`))
      }
    })

    setTimeout(() => {
      if (!resolved) {
        resolved = true
        reject(new Error('Plugin server startup timed out (15s)'))
      }
    }, 15000)
  })
}

// Overlay window configuration: Fullscreen overlay vs Small hitbox (compact)
const OVERLAY_CONFIG_FILE = path.join(DATA_DIR, 'overlay-config.json')
function readOverlayConfig() {
  try {
    const cfg = JSON.parse(fs.readFileSync(OVERLAY_CONFIG_FILE, 'utf8'))
    return Object.assign({ fullScreen: false, compactW: 520, compactH: 480 }, cfg)
  } catch {
    return { fullScreen: false, compactW: 520, compactH: 480 }
  }
}
function writeOverlayConfig(cfg) {
  try {
    fs.writeFileSync(OVERLAY_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8')
  } catch {}
}

function setFullScreenMode(enable) {
  const cfg = readOverlayConfig()
  cfg.fullScreen = Boolean(enable)
  writeOverlayConfig(cfg)
  if (!mainWindow || mainWindow.isDestroyed()) return
  const primaryDisplay = screen.getPrimaryDisplay()
  const workArea = primaryDisplay.workArea
  if (cfg.fullScreen) {
    mainWindow.setBounds({
      x: workArea.x,
      y: workArea.y,
      width: workArea.width,
      height: workArea.height,
    })
    log(`Switched to FULL SCREEN: ${workArea.width}x${workArea.height}`)
  } else {
    const w = cfg.compactW || 520
    const h = cfg.compactH || 480
    const x = (typeof cfg.compactX === 'number' && isFinite(cfg.compactX))
      ? Math.max(workArea.x, Math.min(workArea.x + workArea.width - w, cfg.compactX))
      : (workArea.x + workArea.width - w)
    const y = (typeof cfg.compactY === 'number' && isFinite(cfg.compactY))
      ? Math.max(workArea.y, Math.min(workArea.y + workArea.height - h, cfg.compactY))
      : (workArea.y + workArea.height - h)
    mainWindow.setBounds({ x: Math.round(x), y: Math.round(y), width: w, height: h })
    log(`Switched to SMALL HITBOX (Compact): ${w}x${h} at (${x}, ${y})`)
  }
  try {
    mainWindow.webContents.send('fullscreen-mode-changed', { fullScreen: cfg.fullScreen })
  } catch {}
  updateTrayContextMenu()
}
// ── Overlay Window Creation ──────────────────────────────────────────────────
function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const workArea = primaryDisplay.workArea
  log(`Primary display workArea: ${workArea.width}x${workArea.height} at (${workArea.x}, ${workArea.y})`)

  const cfg = readOverlayConfig()
  const isFull = cfg.fullScreen === true
  const winW = isFull ? workArea.width : (cfg.compactW || 520)
  const winH = isFull ? workArea.height : (cfg.compactH || 480)
  let winX = isFull ? workArea.x : (typeof cfg.compactX === 'number' ? cfg.compactX : workArea.x + workArea.width - winW)
  let winY = isFull ? workArea.y : (typeof cfg.compactY === 'number' ? cfg.compactY : workArea.y + workArea.height - winH)
  if (!isFull) {
    winX = Math.max(workArea.x, Math.min(workArea.x + workArea.width - winW, winX))
    winY = Math.max(workArea.y, Math.min(workArea.y + workArea.height - winH, winY))
  }
  log(`Window bounds: ${winW}x${winH} at (${winX}, ${winY}) [fullScreen=${isFull}]`)

  mainWindow = new BrowserWindow({
    x: Math.round(winX),
    y: Math.round(winY),
    width: Math.round(winW),
    height: Math.round(winH),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true, // Hide from Windows Taskbar so it runs in background
    resizable: false,
    hasShadow: false,
    focusable: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  })

  // Ensure top-most overlay positioning
  mainWindow.setAlwaysOnTop(true, 'screen-saver')

  // Start with click-through enabled on transparent areas
  mainWindow.setIgnoreMouseEvents(true, { forward: true })

  const targetUrl = `http://127.0.0.1:${serverPort}/`
  log(`Loading URL: ${targetUrl}`)
  mainWindow.loadURL(targetUrl)

  // Modern event listener for console messages
  mainWindow.webContents.on('console-message', (event, ...legacyArgs) => {
    let msg = '', lvl = 0, src = '', ln = 0
    if (event && typeof event === 'object' && event.message !== undefined) {
      msg = event.message
      lvl = event.level || 0
      src = event.sourceId || ''
      ln = event.line || 0
    } else {
      lvl = legacyArgs[0] || 0
      msg = legacyArgs[1] || ''
      ln = legacyArgs[2] || 0
      src = legacyArgs[3] || ''
    }
    if (msg && msg.includes('Electron Security Warning')) return
    log(`[Renderer Console L${lvl}] ${msg} (${src}:${ln})`)
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    log(`Renderer did-fail-load: ${errorCode} - ${errorDescription}`)
  })

  mainWindow.webContents.on('did-finish-load', () => {
    log('Renderer did-finish-load successfully')
  })

  mainWindow.on('show', () => {
    if (tray) updateTrayContextMenu()
  })

  mainWindow.on('hide', () => {
    if (tray) updateTrayContextMenu()
  })

  mainWindow.on('closed', () => {
    log('Main window closed')
    mainWindow = null
  })

  // Handle display changes (resolution change, DPI scaling, multi-monitor attach/detach)
  screen.on('display-metrics-changed', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const cfg = readOverlayConfig()
      if (cfg.fullScreen) {
        const display = screen.getPrimaryDisplay()
        const area = display.workArea
        mainWindow.setBounds({
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height,
        })
        log(`Display metrics changed: updated window bounds to ${area.width}x${area.height}`)
      }
    }
  })
}

// ── Notification Area / System Tray ──────────────────────────────────────────
function getTrayIcon() {
  const candidates = [
    path.join(__dirname, 'tray-icon.ico'),
    path.join(__dirname, 'tray-icon.png'),
    path.join(__dirname, 'icon.png'),
    path.join(__dirname, 'assets', 'DSniang1.png'),
  ]
  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      if (cand.endsWith('.ico')) {
        return { icon: nativeImage.createFromPath(cand), path: cand }
      }
      return { icon: nativeImage.createFromPath(cand).resize({ width: 32, height: 32 }), path: cand }
    }
  }
  return { icon: nativeImage.createEmpty(), path: '' }
}

function updateTrayContextMenu() {
  if (!tray) return
  const isVisible = mainWindow && mainWindow.isVisible()
  const autoStartActive = isAutoStartEnabled()

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'DeepSeek Chibi Overlay',
      enabled: false,
    },
    {
      label: 'Full Screen Mode',
      type: 'checkbox',
      checked: readOverlayConfig().fullScreen === true,
      click: (menuItem) => {
        setFullScreenMode(menuItem.checked)
      },
    },
    { type: 'separator' },
    {
      label: isVisible ? 'Hide Chibi to Background' : 'Show Chibi on Desktop',
      click: () => {
        toggleChibiVisibility()
      },
    },
    {
      label: 'Start with Windows (Auto-start)',
      type: 'checkbox',
      checked: autoStartActive,
      click: (menuItem) => {
        setAutoStart(menuItem.checked)
        updateTrayContextMenu()
      },
    },
    {
      label: 'Reset Position (Bottom-Right)',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          const cfg = readOverlayConfig()
          const primaryDisplay = screen.getPrimaryDisplay()
          const workArea = primaryDisplay.workArea
          cfg.compactX = workArea.x + workArea.width - (cfg.compactW || 520)
          cfg.compactY = workArea.y + workArea.height - (cfg.compactH || 480)
          writeOverlayConfig(cfg)
          mainWindow.setPosition(Math.round(cfg.compactX), Math.round(cfg.compactY))
          mainWindow.webContents.executeJavaScript(`
            try {
              localStorage.removeItem('dshw-pos');
              localStorage.removeItem('dshw-size');
              localStorage.removeItem('dshw-role');
              location.reload();
            } catch(e) {}
          `)
        }
      },
    },
    {
      label: 'Reload Overlay',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.reload()
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Exit Application',
      click: () => {
        cleanupAndQuit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
}

function toggleChibiVisibility() {
  if (!mainWindow) return
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
  }
  updateTrayContextMenu()
}

function setupTray() {
  try {
    const { icon, path: iconPath } = getTrayIcon()
    tray = new Tray(icon)
    tray.setToolTip('DeepSeek Chibi Overlay\n(Click to show/hide, Right-click for options)')

    // Clicking the notification icon toggles the chibi
    tray.on('click', () => {
      toggleChibiVisibility()
    })
    tray.on('double-click', () => {
      toggleChibiVisibility()
    })

    updateTrayContextMenu()

    // Show a Windows notification alert on startup
    try {
      if (Notification.isSupported()) {
        const notif = new Notification({
          title: 'DeepSeek Chibi Overlay',
          body: 'Chibi is running in the background! Click this notification icon to show/hide or right-click for settings.',
          icon: iconPath || undefined,
          silent: true,
        })
        notif.show()
      } else {
        tray.displayBalloon({
          title: 'DeepSeek Chibi Overlay',
          content: 'Chibi is running in the background! Click this icon to show/hide or right-click for options.',
          icon: iconPath,
        })
      }
    } catch {}

    log('System tray initialized with notification icon')
  } catch (err) {
    log(`System tray error: ${err.message}`)
  }
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.on('set-ignore-mouse', (_event, ignore) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setIgnoreMouseEvents(Boolean(ignore), { forward: true })
  }
})

ipcMain.on('get-fullscreen-mode', (event) => {
  const cfg = readOverlayConfig()
  event.returnValue = cfg.fullScreen === true
})

ipcMain.on('set-fullscreen-mode', (_event, enabled) => {
  setFullScreenMode(enabled)
})

let dragCursorOffset = null
ipcMain.on('start-compact-drag', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const cursor = screen.getCursorScreenPoint()
  const [wx, wy] = mainWindow.getPosition()
  dragCursorOffset = { x: cursor.x - wx, y: cursor.y - wy }
})

ipcMain.on('compact-drag', () => {
  if (!dragCursorOffset || !mainWindow || mainWindow.isDestroyed()) return
  const cursor = screen.getCursorScreenPoint()
  const newX = Math.round(cursor.x - dragCursorOffset.x)
  const newY = Math.round(cursor.y - dragCursorOffset.y)
  mainWindow.setPosition(newX, newY)
})

ipcMain.on('stop-compact-drag', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return
  dragCursorOffset = null
  const [curX, curY] = mainWindow.getPosition()
  const cfg = readOverlayConfig()
  cfg.compactX = curX
  cfg.compactY = curY
  writeOverlayConfig(cfg)
})

function cleanupAndQuit() {
  log('Shutting down application')
  if (serverProcess && serverProcess.pid) {
    try {
      execSync(`taskkill /pid ${serverProcess.pid} /f /t`, { stdio: 'ignore' })
    } catch {
      try { serverProcess.kill() } catch {}
    }
    serverProcess = null
  }
  if (tray) {
    try {
      tray.destroy()
    } catch {}
    tray = null
  }
  app.quit()
}

// ── App Lifecycle ────────────────────────────────────────────────────────────
app.commandLine.appendSwitch('enable-transparent-visuals')

const isRestartRequested = process.argv.some(arg => arg === '--restart' || arg === '--force' || arg === '-r')
if (isRestartRequested) {
  try {
    const curPid = process.pid
    const killCmd = `Get-CimInstance Win32_Process | Where-Object { ($_.Name -match 'electron|DeepSeekWhaleWidget') -and ($_.ProcessId -ne ${curPid}) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`
    execSync(`powershell -NoProfile -Command "${killCmd}"`, { stdio: 'ignore' })
    const lockFile = path.join(DATA_DIR, 'UserData', 'SingletonLock')
    if (fs.existsSync(lockFile)) { try { fs.unlinkSync(lockFile) } catch {} }
  } catch {}
}

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  log('Another instance is already running. Exiting cleanly.')
  console.log('[DeepSeek Chibi] Application is already running in the background. Check your notification tray icons.')
  console.log('[DeepSeek Chibi] To force restart, run: npm start -- --restart')
  app.exit(0)
} else {
  app.on('second-instance', () => {
    log('Second instance detected. Showing, restoring and focusing main window.')
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.setAlwaysOnTop(true, 'screen-saver')
      mainWindow.focus()
      updateTrayContextMenu()
      try {
        mainWindow.webContents.send('ensure-visible')
      } catch {}
    }
  })

  app.whenReady().then(async () => {
    try {
      serverProcess = await startBackendServer()
      createOverlayWindow()
      setupTray()
    } catch (err) {
      log(`Startup error: ${err && err.message ? err.message : err}`)
      const { dialog } = require('electron')
      dialog.showErrorBox(
        'DeepSeek Chibi Overlay',
        `Failed to start backend server: ${err && err.message ? err.message : err}`
      )
      cleanupAndQuit()
    }
  })

  app.on('window-all-closed', () => {
    // Keep running in tray even if window is hidden
  })

  app.on('before-quit', () => {
    if (serverProcess && serverProcess.pid) {
      try {
        execSync(`taskkill /pid ${serverProcess.pid} /f /t`, { stdio: 'ignore' })
      } catch {
        try { serverProcess.kill() } catch {}
      }
      serverProcess = null
    }
  })
}
