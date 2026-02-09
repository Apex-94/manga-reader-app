const { contextBridge, ipcRenderer } = require('electron');

const backendUrl = process.env.PYYOMI_BACKEND_URL;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
if (backendUrl) {
  contextBridge.exposeInMainWorld('__BACKEND_URL__', backendUrl);
}

contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.sendSync('get-app-path'),
  restartApp: () => ipcRenderer.send('restart-app'),
  backendUrl: backendUrl || null,
  
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
