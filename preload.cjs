const { contextBridge, ipcRenderer } = require('electron');

// Secure context bridge for the React front-end
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  readDb: () => ipcRenderer.invoke('read-db'),
  writeDb: (data) => ipcRenderer.invoke('write-db', data),
  isElectron: true
});

