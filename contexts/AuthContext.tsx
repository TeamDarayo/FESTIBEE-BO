'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  password: string | null;
  isAuthenticated: boolean;
  setPassword: (password: string) => void;
  logout: () => void;
  currentMode: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

const SESSION_PASSWORD_KEY = 'admin-password';
const SESSION_MODE_KEY = 'admin-password-mode';

export function AuthProvider({ children }: AuthProviderProps) {
  const [password, setPasswordState] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기화: sessionStorage에서 비밀번호 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPassword = sessionStorage.getItem(SESSION_PASSWORD_KEY);
      const savedMode = localStorage.getItem('api-mode');
      const sessionMode = sessionStorage.getItem(SESSION_MODE_KEY);

      // 모드가 변경되었는지 확인
      if (savedMode !== sessionMode) {
        // 모드가 변경되었으면 비밀번호 초기화
        sessionStorage.removeItem(SESSION_PASSWORD_KEY);
        sessionStorage.setItem(SESSION_MODE_KEY, savedMode || '');
        setPasswordState(null);
      } else if (savedPassword) {
        setPasswordState(savedPassword);
      }

      setCurrentMode(savedMode);
      setIsLoading(false);
    }
  }, []);

  // 모드 변경 감지
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      const checkModeChange = () => {
        const currentApiMode = localStorage.getItem('api-mode');
        if (currentApiMode !== currentMode) {
          // 모드가 변경되면 비밀번호 초기화
          sessionStorage.removeItem(SESSION_PASSWORD_KEY);
          sessionStorage.setItem(SESSION_MODE_KEY, currentApiMode || '');
          setPasswordState(null);
          setCurrentMode(currentApiMode);
        }
      };

      // storage 이벤트 리스너 (다른 탭에서 변경 감지)
      window.addEventListener('storage', checkModeChange);
      
      // 주기적으로 확인 (같은 탭에서 변경 감지)
      const interval = setInterval(checkModeChange, 1000);

      return () => {
        window.removeEventListener('storage', checkModeChange);
        clearInterval(interval);
      };
    }
  }, [currentMode, isLoading]);

  const setPassword = (newPassword: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_PASSWORD_KEY, newPassword);
      const currentApiMode = localStorage.getItem('api-mode');
      sessionStorage.setItem(SESSION_MODE_KEY, currentApiMode || '');
      setPasswordState(newPassword);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_PASSWORD_KEY);
      setPasswordState(null);
    }
  };

  const isAuthenticated = !!password;

  return (
    <AuthContext.Provider value={{ password, isAuthenticated, setPassword, logout, currentMode }}>
      {children}
    </AuthContext.Provider>
  );
}
