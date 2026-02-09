import React, { createContext, useContext, useState, useEffect } from 'react';

type ColorMode = 'light' | 'dark';

interface ColorModeContextType {
  mode: ColorMode;
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

export function useColorMode() {
  const context = useContext(ColorModeContext);
  if (context === undefined) {
    throw new Error('useColorMode must be used within a ColorModeProvider');
  }
  return context;
}

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ColorMode>('light');

  useEffect(() => {
    const saved = localStorage.getItem('color-mode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved) {
      setMode(saved as ColorMode);
    } else if (prefersDark) {
      setMode('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('color-mode', mode);
  }, [mode]);

  const toggleColorMode = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      {children}
    </ColorModeContext.Provider>
  );
}
