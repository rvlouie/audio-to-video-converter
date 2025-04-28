const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getTemplates: () => ipcRenderer.invoke('get-templates'),
    saveTemplate: (tpl) => ipcRenderer.invoke('save-template', tpl),
    convertFiles: (files, tpl) => ipcRenderer.invoke('convert-files', { files, template: tpl })
});