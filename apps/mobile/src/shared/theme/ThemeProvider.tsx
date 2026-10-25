import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { setBackgroundColorAsync } from 'expo-system-ui';
import { Uniwind, useCSSVariable } from 'uniwind';

import { storage } from '@/shared/lib/storage';

import { themeName, type Palette, type Scheme } from './tokens';

const PALETTE_KEY = 'theme:palette';

// Цвета для мест, куда className не доходит: SVG, нативные шторки, системные панели.
// Значения читаются из тех же CSS-переменных темы, что и классы, — второго источника цветов нет
const COLOR_VARS = {
  paper: '--color-sb-paper',
  sheet: '--color-sb-sheet',
  ink: '--color-sb-ink',
  blue: '--color-sb-blue',
  rule: '--color-sb-rule',
  tint: '--color-sb-tint',
  danger: '--color-sb-danger',
  gold: '--color-sb-gold',
  canvas: '--color-canvas',
  mist: '--color-mist',
  smoke: '--color-smoke',
  slate: '--color-slate',
  hatch: '--color-hatch',
  live: '--color-live',
  rest: '--color-rest',
} as const;

export type Colors = Record<keyof typeof COLOR_VARS, string>;

const COLOR_KEYS = Object.keys(COLOR_VARS) as (keyof typeof COLOR_VARS)[];

type ThemeContextValue = {
  colors: Colors;
  scheme: Scheme;
  palette: Palette;
  /** Выбранная палитра. Схема (свет/тёмная) следует за системой */
  setPalette: (palette: Palette) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const readPalette = (): Palette => (storage.getString(PALETTE_KEY) === 'rose' ? 'rose' : 'classic');

// Тему ставим до первой отрисовки: иначе экран мигнёт синей светлой, пока не сработает эффект
Uniwind.setTheme(themeName(readPalette(), Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'));

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const scheme: Scheme = systemScheme === 'dark' ? 'dark' : 'light';
  const [palette, setPaletteState] = useState<Palette>(readPalette);

  useEffect(() => {
    Uniwind.setTheme(themeName(palette, scheme));
  }, [palette, scheme]);

  const values = useCSSVariable(COLOR_KEYS.map((key) => COLOR_VARS[key]));
  const colorKey = values.join();
  const colors = useMemo(
    () => Object.fromEntries(COLOR_KEYS.map((key, i) => [key, String(values[i] ?? '#000')])) as Colors,
    // values — новый массив на каждый рендер; цвета меняются только вместе с темой
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [palette, scheme, colorKey],
  );

  const value = useMemo(
    () => ({
      colors,
      scheme,
      palette,
      setPalette: (next: Palette) => {
        storage.set(PALETTE_KEY, next);
        setPaletteState(next);
      },
    }),
    [colors, scheme, palette],
  );

  // Фон системных поверхностей (подложка статус-бара, свитчер приложений) — цвет бумаги темы
  useEffect(() => {
    void setBackgroundColorAsync(colors.paper);
  }, [colors.paper]);

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <NavigationBar style={scheme === 'dark' ? 'dark' : 'light'} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme: провайдер не подключён');
  return ctx;
};
