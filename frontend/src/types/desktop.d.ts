// Type definitions for desktop app
declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: (command: string, args?: any) => Promise<any>;
      };
    };
    __BACKEND_URL__?: string;
  }
}

export {};
