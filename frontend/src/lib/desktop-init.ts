// Desktop app initialization script
// This script is loaded before the main app to configure the API base URL

declare global {
  interface Window {
    __BACKEND_URL__?: string;
    __TAURI__?: {
      core?: {
        invoke?: <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
      };
    };
  }
}

let backendStarted = false;
const FALLBACK_BACKEND_URL = 'http://localhost:8000';

function getInjectedBackendUrl(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const value = window.__BACKEND_URL__;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function getTauriInvoke() {
  return window.__TAURI__?.core?.invoke;
}

function isTauriRuntime(): boolean {
  return typeof getTauriInvoke() === 'function';
}

export async function startBackend(): Promise<string> {
  if (backendStarted) {
    return getInjectedBackendUrl() || FALLBACK_BACKEND_URL;
  }

  const injectedUrl = getInjectedBackendUrl();
  if (!isTauriRuntime()) {
    const url = injectedUrl || FALLBACK_BACKEND_URL;
    console.log('[Desktop] Non-Tauri runtime detected, using backend URL:', url);
    window.__BACKEND_URL__ = url;
    backendStarted = true;
    return url;
  }

  const invoke = getTauriInvoke();
  if (!invoke) {
    window.__BACKEND_URL__ = injectedUrl || FALLBACK_BACKEND_URL;
    return window.__BACKEND_URL__;
  }

  try {
    console.log('[Desktop] Starting backend...');
    const url = await invoke<string>('start_backend');
    console.log('[Desktop] Backend started at:', url);
    window.__BACKEND_URL__ = url;
    backendStarted = true;
    return url;
  } catch (error) {
    console.error('[Desktop] Failed to start backend:', error);
    window.__BACKEND_URL__ = injectedUrl || FALLBACK_BACKEND_URL;
    return window.__BACKEND_URL__;
  }
}

export async function getBackendUrl(): Promise<string> {
  if (!isTauriRuntime()) {
    return getInjectedBackendUrl() || FALLBACK_BACKEND_URL;
  }

  const invoke = getTauriInvoke();
  if (!invoke) {
    return getInjectedBackendUrl() || FALLBACK_BACKEND_URL;
  }

  try {
    const url = await invoke<string>('backend_url');
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
  if (!isTauriRuntime()) {
    return 'Not running in Tauri';
  }

  const invoke = getTauriInvoke();
  if (!invoke) {
    return 'Not running in Tauri';
  }

  try {
    const logs = await invoke<string>('get_backend_logs');
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
      const url = await startBackend();
      window.dispatchEvent(new CustomEvent('backend-ready', { detail: { url } }));
      return url;
    } catch (error) {
      console.log('[Desktop] Backend initialization fallback triggered');
      const url = getInjectedBackendUrl() || FALLBACK_BACKEND_URL;
      window.__BACKEND_URL__ = url;
      window.dispatchEvent(new CustomEvent('backend-ready', { detail: { url } }));
      return url;
    }
  })();
  
  return initPromise;
}

// Auto-initialize
initializeBackend();
