// Desktop app initialization script
// This script is loaded before the main app to configure the API base URL

(function() {
  // Check if we're running in Tauri (desktop app)
  if (window.__TAURI__) {
    const { invoke } = window.__TAURI__.core;
    
    // Get the backend URL from Tauri
    invoke('backend_url')
      .then((url) => {
        console.log('[Desktop] Backend URL:', url);
        // Store the backend URL for the app to use
        window.__BACKEND_URL__ = url;
        
        // Dispatch an event to notify the app
        window.dispatchEvent(new CustomEvent('backend-ready', { detail: { url } }));
      })
      .catch((error) => {
        console.error('[Desktop] Failed to get backend URL:', error);
        // Fallback to localhost:8000
        window.__BACKEND_URL__ = 'http://localhost:8000';
        window.dispatchEvent(new CustomEvent('backend-ready', { detail: { url: 'http://localhost:8000' } }));
      });
  } else {
    // Not running in Tauri, use default backend URL
    console.log('[Web] Not running in Tauri, using default backend URL');
    window.__BACKEND_URL__ = 'http://localhost:8000';
    window.dispatchEvent(new CustomEvent('backend-ready', { detail: { url: 'http://localhost:8000' } }));
  }
})();
