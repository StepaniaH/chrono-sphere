import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { translate, type Locale, type ResolvedTheme, type ThemeMode } from '../i18n';
import { PreferencesContext, type PreferencesContextValue } from './preferencesCore';

const LOCALE_STORAGE_KEY = 'chrono-sphere.locale';
const THEME_STORAGE_KEY = 'chrono-sphere.theme';

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'zh';
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === 'en' ? 'en' : 'zh';
}

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const resolvedTheme: ResolvedTheme = themeMode === 'system' ? systemTheme : themeMode;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }, [locale, resolvedTheme]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => (current === 'zh' ? 'en' : 'zh'));
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((current) => {
      if (current === 'system') {
        return systemTheme === 'dark' ? 'light' : 'dark';
      }
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemTheme]);

  const value = useMemo<PreferencesContextValue>(() => {
    return {
      locale,
      themeMode,
      resolvedTheme,
      toggleLocale,
      toggleTheme,
      setLocale,
      setThemeMode,
      t: (key, vars) => translate(locale, key, vars),
    };
  }, [locale, themeMode, resolvedTheme, toggleLocale, toggleTheme, setLocale, setThemeMode]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};
