// Desktop app initialization script
// This script is loaded before the main app to configure the API base URL

// Declare Tauri types for TypeScript
declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: (command: string, args?: Record<string, unknown>) => Promise<unknown>;
      };
      window: {
        getCurrentWindow: () => {
          toggleDevTools: () => void;
        };
      };
    };
    __BACKEND_URL__?: string;
  }
}

export async function startBackend(): Promise<string> {
  // Wait for Tauri to be ready
  let tauri = window.__TAURI__;
  let retries = 0;
  
  while (!tauri && retries < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    tauri = window.__TAURI__;
    retries++;
  }
  
  if (tauri) {
    try {
      console.log('[Desktop] Starting backend...');
      const url = await tauri.core.invoke('start_backend') as string;
      console.log('[Desktop] Backend started at:', url);
      window.__BACKEND_URL__ = url;
      return url;
    } catch (error) {
      console.error('[Desktop] Failed to start backend:', error);
      window.__BACKEND_URL__ = 'http://localhost:8000';
      return 'http://localhost:8000';
    }
  } else {
    console.log('[Web] Not running in Tauri, using default backend URL');
    window.__BACKEND_URL__ = 'http://localhost:8000';
    return 'http://localhost:8000';
  }
}

export async function getBackendUrl(): Promise<string> {
  const tauri = window.__TAURI__;
  if (tauri) {
    try {
      const url = await tauri.core.invoke('backend_url') as string;
      console.log('[Desktop] Backend URL:', url);
      window.__BACKEND_URL__ = url;
      return url;
    } catch (error) {
      console.error('[Desktop] Failed to get backend URL:', error);
      // Try to start backend if not running
      return startBackend();
    }
  } else {
    console.log('[Web] Not running in Tauri, using default backend URL');
    window.__BACKEND_URL__ = 'http://localhost:8000';
    return 'http://localhost:8000';
  }
}

export async function getBackendLogs(): Promise<string> {
  const tauri = window.__TAURI__;
  if (tauri) {
    try {
      const logs = await tauri.core.invoke('get_backend_logs') as string;
      return logs;
    } catch (error) {
      console.error('[Desktop] Failed to get backend logs:', error);
      return 'Failed to get logs';
    }
  }
  return 'Not running in Tauri';
}

export function toggleDevTools(): void {
  const tauri = window.__TAURI__;
  if (tauri) {
    try {
      const win = tauri.window.getCurrentWindow();
      win.toggleDevTools();
    } catch (error) {
      console.error('[Desktop] Failed to toggle devtools:', error);
    }
  }
}

export function isTauri(): boolean {
  return !!window.__TAURI__;
}

// Initialize on load - start backend first
(function() {
  startBackend().then((url) => {
    window.dispatchEvent(new CustomEvent('backend-ready', { detail: { url } }));
  });
})();
