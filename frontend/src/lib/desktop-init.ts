// Desktop app initialization script
// This script is loaded before the main app to configure the API base URL

declare global {
  interface Window {
    __BACKEND_URL__?: string;
    __TAURI__?: any;
  }
}

let backendStarted = false;

// Check if running in Tauri by trying to use Tauri API
async function checkIsTauri(): Promise<boolean> {
  try {
    // Try to import Tauri API - this will throw in non-Tauri environments
    await import('@tauri-apps/api/core');
    return true;
  } catch (error) {
    return false;
  }
}

// Dynamically import Tauri API only when running in Tauri
async function invokeTauri<T>(command: string): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command);
}

export async function startBackend(): Promise<string> {
  if (backendStarted) {
    return window.__BACKEND_URL__ || 'http://localhost:8000';
  }
  
  const isTauriEnv = await checkIsTauri();
  
  if (!isTauriEnv) {
    console.log('[Desktop] Not running in Tauri, using default URL');
    window.__BACKEND_URL__ = 'http://localhost:8000';
    backendStarted = true;
    return 'http://localhost:8000';
  }
  
  try {
    console.log('[Desktop] Starting backend...');
    const url = await invokeTauri<string>('start_backend');
    console.log('[Desktop] Backend started at:', url);
    window.__BACKEND_URL__ = url;
    backendStarted = true;
    return url;
  } catch (error) {
    console.error('[Desktop] Failed to start backend:', error);
    window.__BACKEND_URL__ = 'http://localhost:8000';
    return 'http://localhost:8000';
  }
}

export async function getBackendUrl(): Promise<string> {
  const isTauriEnv = await checkIsTauri();
  
  if (!isTauriEnv) {
    return window.__BACKEND_URL__ || 'http://localhost:8000';
  }
  
  try {
    const url = await invokeTauri<string>('backend_url');
    console.log('[Desktop] Backend URL:', url);
    window.__BACKEND_URL__ = url;
    return url;
  } catch (error) {
    console.error('[Desktop] Failed to get backend URL:', error);
    // Try to start backend if not running
    return startBackend();
  }
}

export async function getBackendLogs(): Promise<string> {
  const isTauriEnv = await checkIsTauri();
  
  if (!isTauriEnv) {
    return 'Not running in Tauri';
  }
  
  try {
    const logs = await invokeTauri<string>('get_backend_logs');
    return logs;
  } catch (error) {
    console.error('[Desktop] Failed to get backend logs:', error);
    return 'Failed to get logs';
  }
}

// Initialize on load - start backend first
// Use a promise to track initialization
let initPromise: Promise<string> | null = null;

export async function initializeBackend(): Promise<string> {
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      // Try to invoke a Tauri command to check if we're in Tauri
      // If this throws, we're not in Tauri
      console.log('[Desktop] Checking if running in Tauri...');
      const url = await startBackend();
      window.dispatchEvent(new CustomEvent('backend-ready', { detail: { url } }));
      return url;
    } catch (error) {
      // Not in Tauri or failed to start
      console.log('[Web] Not running in Tauri or failed to start, using default backend URL');
      const url = 'http://localhost:8000';
      window.__BACKEND_URL__ = url;
      window.dispatchEvent(new CustomEvent('backend-ready', { detail: { url } }));
      return url;
    }
  })();
  
  return initPromise;
}

// Auto-initialize
initializeBackend();
