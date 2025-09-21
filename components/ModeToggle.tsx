'use client';

import { Switch } from '@headlessui/react';
import { useMode } from '@/contexts/ModeContext';

export function ModeToggle() {
  const { mode, setMode, isLoading } = useMode();

  if (isLoading) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-600">API Mode</span>
          <span className="text-xs text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  const isDevMode = mode === 'dev';

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-600">API Mode</span>
        <span className={`text-xs font-semibold ${
          isDevMode ? 'text-yellow-600' : 'text-blue-600'
        }`}>
          {isDevMode ? 'DEVELOPMENT' : 'PRODUCTION'}
        </span>
      </div>
      
      <Switch
        checked={isDevMode}
        onChange={(enabled) => setMode(enabled ? 'dev' : 'prod')}
        className={`${
          isDevMode ? 'bg-yellow-500' : 'bg-blue-500'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isDevMode ? 'focus:ring-yellow-500' : 'focus:ring-blue-500'
        }`}
      >
        <span className="sr-only">Toggle API mode</span>
        <span
          className={`${
            isDevMode ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </Switch>
    </div>
  );
}

export function ModeIndicator() {
  const { mode, isLoading } = useMode();

  if (isLoading) {
    return null;
  }

  const isDevMode = mode === 'dev';

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
      isDevMode 
        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
        : 'bg-blue-100 text-blue-800 border border-blue-200'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        isDevMode ? 'bg-yellow-500' : 'bg-blue-500'
      }`} />
      {isDevMode ? 'DEV' : 'PROD'}
    </div>
  );
}
