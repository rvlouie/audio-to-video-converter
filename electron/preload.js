const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    convertFiles: (files, template) => ipcRenderer.invoke('convert-files', { files, template })
});