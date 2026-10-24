// Preload script for Electron overlay
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronOverlay', {
  setIgnoreMouseEvents: (ignore) => {
    ipcRenderer.send('set-ignore-mouse', ignore)
  },
  saveWidgetState: (state) => {
    ipcRenderer.send('save-widget-state', state)
  }
})
