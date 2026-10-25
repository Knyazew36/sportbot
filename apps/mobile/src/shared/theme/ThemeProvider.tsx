import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { useColorScheme } from 'react-native';

import { storage } from '@/shared/lib/storage';
import { getColors, type Colors, type Palette, type Scheme } from './tokens';

const PALETTE_KEY = 'theme:palette';

type ThemeContextValue = {
  colors: Colors;
  scheme: Scheme;
  palette: Palette;
  /** Выбранная палитра. Схема (свет/тема) следует за системой */
  setPalette: (palette: Palette) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const readPalette = (): Palette => (storage.getString(PALETTE_KEY) === 'rose' ? 'rose' : 'classic');

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const scheme: Scheme = systemScheme === 'dark' ? 'dark' : 'light';
  const [palette, setPaletteState] = useState<Palette>(readPalette);

  const setPalette = (next: Palette) => {
    storage.set(PALETTE_KEY, next);
    setPaletteState(next);
  };

  const value = useMemo(
    () => ({ colors: getColors(palette, scheme), scheme, palette, setPalette }),
    [palette, scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme: провайдер не подключён');
  return ctx;
};
