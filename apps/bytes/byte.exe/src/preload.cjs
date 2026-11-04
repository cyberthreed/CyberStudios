'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('byte', Object.freeze({
  snapshot: () => ipcRenderer.invoke('byte:snapshot'),
  action: name => ipcRenderer.invoke('byte:action', name),
  settings: patch => ipcRenderer.invoke('byte:settings', patch),
  dragStart: () => ipcRenderer.invoke('byte:drag-start'),
  dragEnd: () => ipcRenderer.invoke('byte:drag-end'),
  menu: () => ipcRenderer.invoke('byte:menu'),
  closeSettings: () => ipcRenderer.invoke('byte:close-settings'),
  onChange: callback => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('byte:changed', listener);
    return () => ipcRenderer.removeListener('byte:changed', listener);
  }
}));
