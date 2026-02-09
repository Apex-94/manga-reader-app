// Desktop app initialization script
// This script is loaded before the main app to configure the API base URL

// Declare Tauri types for TypeScript
declare global {
  interface Window {
    __TAURI__: {
      core: {
        invoke: (command: string, args?: Record<string, unknown>) => Promise<unknown>;
      };
      window: {
        getCurrentWindow: () => {
          toggleDevTools: () => void;
        };
      };
    };
    __BACKEND_URL__: string;
  }
}

export async function getBackendUrl(): Promise<string> {
  if (window.__TAURI__) {
    try {
      const url = await window.__TAURI__.core.invoke('backend_url') as string;
      console.log('[Desktop] Backend URL:', url);
      window.__BACKEND_URL__ = url;
      return url;
    } catch (error) {
      console.error('[Desktop] Failed to get backend URL:', error);
      window.__BACKEND_URL__ = 'http://localhost:8000';
      return 'http://localhost:8000';
    }
  } else {
    console.log('[Web] Not running in Tauri, using default backend URL');
    window.__BACKEND_URL__ = 'http://localhost:8000';
    return 'http://localhost:8000';
  }
}

export async function getBackendLogs(): Promise<string> {
  if (window.__TAURI__) {
    try {
      const logs = await window.__TAURI__.core.invoke('get_backend_logs') as string;
      return logs;
    } catch (error) {
      console.error('[Desktop] Failed to get backend logs:', error);
      return 'Failed to get logs';
    }
  }
  return 'Not running in Tauri';
}

export function toggleDevTools(): void {
  if (window.__TAURI__) {
    try {
      const win = window.__TAURI__.window.getCurrentWindow();
      win.toggleDevTools();
    } catch (error) {
      console.error('[Desktop] Failed to toggle devtools:', error);
    }
  }
}

export function isTauri(): boolean {
  return !!window.__TAURI__;
}

// Initialize on load
(function() {
  getBackendUrl().then((url) => {
    window.dispatchEvent(new CustomEvent('backend-ready', { detail: { url } }));
  });
})();
