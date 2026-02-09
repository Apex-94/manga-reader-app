const { contextBridge, ipcRenderer } = require('electron');

const backendUrl = process.env.PYYOMI_BACKEND_URL || 'http://localhost:8000';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('__BACKEND_URL__', backendUrl);

contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.sendSync('get-app-path'),
  restartApp: () => ipcRenderer.send('restart-app'),
  backendUrl,
  
  // Platform info
  platform: process.platform,
  
  // Version info
  getVersion: () => {
    try {
      const fs = require('fs');
      const packageJson = JSON.parse(fs.readFileSync('../../package.json', 'utf8'));
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }
});
