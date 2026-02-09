// Desktop app initialization script
// This script is loaded before the main app to configure the API base URL

import { invoke } from '@tauri-apps/api/core';

declare global {
  interface Window {
    __BACKEND_URL__?: string;
  }
}

export async function startBackend(): Promise<string> {
  try {
    console.log('[Desktop] Starting backend...');
    const url = await invoke<string>('start_backend');
    console.log('[Desktop] Backend started at:', url);
    window.__BACKEND_URL__ = url;
    return url;
  } catch (error) {
    console.error('[Desktop] Failed to start backend:', error);
    window.__BACKEND_URL__ = 'http://localhost:8000';
    return 'http://localhost:8000';
  }
}

export async function getBackendUrl(): Promise<string> {
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
  try {
    const logs = await invoke<string>('get_backend_logs');
    return logs;
  } catch (error) {
    console.error('[Desktop] Failed to get backend logs:', error);
    return 'Failed to get logs';
  }
}

export function isTauri(): boolean {
  // Check if running in Tauri by checking if the invoke function is available
  // In Tauri 2.0, we check if we're in a Tauri webview
  if (typeof window === 'undefined') return false;
  
  // Check for Tauri internals
  if ((window as any).__TAURI_INTERNALS__) return true;
  
  // Check protocol
  if (window.location.protocol === 'tauri:') return true;
  
  // Check for Tauri global
  if ((window as any).__TAURI__) return true;
  
  return false;
}

// Initialize on load - start backend first
export async function initializeBackend(): Promise<string> {
  // Check if we're in Tauri
  if (isTauri()) {
    console.log('[Desktop] Running in Tauri, starting backend...');
    const url = await startBackend();
    window.dispatchEvent(new CustomEvent('backend-ready', { detail: { url } }));
    return url;
  } else {
    console.log('[Web] Not running in Tauri, using default backend URL');
    const url = 'http://localhost:8000';
    window.__BACKEND_URL__ = url;
    window.dispatchEvent(new CustomEvent('backend-ready', { detail: { url } }));
    return url;
  }
}

// Auto-initialize
initializeBackend();
