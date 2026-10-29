// Preload script for Electron overlay
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronOverlay', {
  setIgnoreMouseEvents: (ignore) => {
    ipcRenderer.send('set-ignore-mouse', ignore)
  },
  saveWidgetState: (state) => {
    ipcRenderer.send('save-widget-state', state)
  },
  setFullScreen: (enabled) => {
    ipcRenderer.send('set-fullscreen-mode', enabled)
  },
  getFullScreen: () => {
    try {
      return ipcRenderer.sendSync('get-fullscreen-mode')
    } catch {
      return false
    }
  },
  startDrag: () => {
    ipcRenderer.send('start-compact-drag')
  },
  drag: () => {
    ipcRenderer.send('compact-drag')
  },
  stopDrag: () => {
    ipcRenderer.send('stop-compact-drag')
  },
  onFullScreenChanged: (cb) => {
    ipcRenderer.on('fullscreen-mode-changed', (_e, data) => cb(data))
  },
  onEnsureVisible: (cb) => {
    ipcRenderer.on('ensure-visible', (_e, data) => cb(data))
  }
})
