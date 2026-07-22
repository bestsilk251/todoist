import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyThemeMode, type ThemeMode } from './theme';

export const THEME_STORAGE_KEY = 'voice-todo:theme-mode';

interface ThemeContextValue {
  mode: ThemeMode;
  ready: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function initialWebTheme(): ThemeMode {
  if (Platform.OS !== 'web') return 'dark';
  try {
    return globalThis.localStorage?.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const initial = initialWebTheme();
    applyThemeMode(initial);
    return initial;
  });
  const [ready, setReady] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        const next: ThemeMode = stored === 'light' ? 'light' : 'dark';
        applyThemeMode(next);
        setModeState(next);
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        applyThemeMode('dark');
        setReady(true);
      });
    return () => { active = false; };
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    ready,
    setMode: (next) => {
      applyThemeMode(next);
      setModeState(next);
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => { /* keep the in-memory choice */ });
    },
  }), [mode, ready]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return value;
}
