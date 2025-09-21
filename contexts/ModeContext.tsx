'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Mode = 'dev' | 'prod';

interface ModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  isLoading: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}

interface ModeProviderProps {
  children: ReactNode;
}

export function ModeProvider({ children }: ModeProviderProps) {
  const [mode, setModeState] = useState<Mode>('prod'); // Default to prod
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load mode from localStorage on mount
    const savedMode = localStorage.getItem('api-mode') as Mode | null;
    if (savedMode && (savedMode === 'dev' || savedMode === 'prod')) {
      setModeState(savedMode);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Update body data attribute for styling
    if (!isLoading) {
      document.body.setAttribute('data-mode', mode);
    }
  }, [mode, isLoading]);

  const setMode = (newMode: Mode) => {
    // Save to localStorage
    localStorage.setItem('api-mode', newMode);
    setModeState(newMode);
    
    // Reload page to apply new API configuration
    window.location.reload();
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, isLoading }}>
      {children}
    </ModeContext.Provider>
  );
}
