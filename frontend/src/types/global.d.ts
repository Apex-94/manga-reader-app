declare global {
  interface Window {
    __BACKEND_URL__?: string;
    electronAPI?: {
      getAppPath?: () => void;
      restartApp?: () => void;
      backendUrl?: string | null;
      platform?: string;
      getVersion?: () => string;
      selectDownloadPath?: () => Promise<string | null>;
    };
  }
}

export {};
