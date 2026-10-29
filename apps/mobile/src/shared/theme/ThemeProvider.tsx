import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setBackgroundColorAsync } from 'expo-system-ui';
import { Uniwind, useCSSVariable } from 'uniwind';

import { storage } from '@/shared/lib/storage';

import { ThemeTransitionView } from './ThemeTransitionView';
import { themeName, type Palette, type Scheme, type ThemeChoice } from './tokens';
import { useThemeTransition } from './use-theme-transition';

const PALETTE_KEY = 'theme:palette';
const CHOICE_KEY = 'theme:choice';

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
  liveDeep: '--color-live-deep',
  rest: '--color-rest',
  restDeep: '--color-rest-deep',
} as const;

export type Colors = Record<keyof typeof COLOR_VARS, string>;

const COLOR_KEYS = Object.keys(COLOR_VARS) as (keyof typeof COLOR_VARS)[];

type ThemeContextValue = {
  colors: Colors;
  scheme: Scheme;
  palette: Palette;
  setPalette: (palette: Palette) => void;
  /** Выбор схемы: auto — как в системе, иначе своя на этом устройстве */
  choice: ThemeChoice;
  setChoice: (choice: ThemeChoice) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const readPalette = (): Palette => (storage.getString(PALETTE_KEY) === 'rose' ? 'rose' : 'classic');

const readChoice = (): ThemeChoice => {
  const value = storage.getString(CHOICE_KEY);
  return value === 'light' || value === 'dark' ? value : 'auto';
};

// Своя схема ставится и системе приложения: нативные шторки, алерты и клавиатура должны совпадать с экраном
// На вебе setColorScheme нет — превью в браузере иначе падает на старте
const applyChoice = (choice: ThemeChoice) => Appearance.setColorScheme?.(choice === 'auto' ? 'unspecified' : choice);

// Тему ставим до первой отрисовки: иначе экран мигнёт синей светлой, пока не сработает эффект
applyChoice(readChoice());
Uniwind.setTheme(themeName(readPalette(), Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'));

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [choice, setChoiceState] = useState<ThemeChoice>(readChoice);
  // Системная схема решает только в auto; свой выбор ставится сразу, без ожидания события Appearance
  const systemScheme = useColorScheme();
  const scheme: Scheme = choice === 'auto' ? (systemScheme === 'dark' ? 'dark' : 'light') : choice;
  const [palette, setPaletteState] = useState<Palette>(readPalette);
  const { transition, ...transitionView } = useThemeTransition();

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
        if (next === palette) return;
        transition(() => {
          storage.set(PALETTE_KEY, next);
          setPaletteState(next);
        });
      },
      choice,
      setChoice: (next: ThemeChoice) => {
        if (next === choice) return;
        transition(() => {
          storage.set(CHOICE_KEY, next);
          applyChoice(next);
          setChoiceState(next);
        });
      },
    }),
    [colors, scheme, palette, choice, transition],
  );

  // Тема навигатора: без неё под экранами при переходе мелькает светлый фон react-navigation по умолчанию
  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: scheme === 'dark',
      colors: {
        ...base.colors,
        primary: colors.blue,
        background: colors.paper,
        card: colors.paper,
        text: colors.ink,
        border: colors.rule,
        notification: colors.danger,
      },
    };
  }, [scheme, colors]);

  // Фон системных поверхностей (подложка статус-бара, свитчер приложений) — цвет бумаги темы
  useEffect(() => {
    void setBackgroundColorAsync(colors.paper);
  }, [colors.paper]);

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <NavigationBar style={scheme === 'dark' ? 'dark' : 'light'} />
      <NavigationThemeProvider value={navigationTheme}>
        <ThemeTransitionView {...transitionView}>{children}</ThemeTransitionView>
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
};

// Skia Canvas рендерит детей своим reconciler'ом, контекст React туда не доходит — пробрасываем тему заново
export const ThemeBridge = ({ value, children }: { value: ThemeContextValue; children?: ReactNode }) => (
  <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
);

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme: провайдер не подключён');
  return ctx;
};
