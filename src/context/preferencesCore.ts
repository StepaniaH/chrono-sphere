import { createContext } from 'react';
import type { Locale, ResolvedTheme, ThemeMode } from '../i18n';

export interface PreferencesContextValue {
  locale: Locale;
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  toggleLocale: () => void;
  toggleTheme: () => void;
  setLocale: (locale: Locale) => void;
  setThemeMode: (mode: ThemeMode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);
