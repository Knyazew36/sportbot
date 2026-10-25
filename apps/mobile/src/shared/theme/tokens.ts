// Дизайн-токены Спортбота. Источник — apps/frontend/src/global.css (--sb-*) и packages/brand/tokens.json.
// В RN нет color-mix(): все производные цвета посчитаны заранее и лежат готовыми hex/rgba.
// Палитра (classic | rose) — отдельная ось от светлой/тёмной схемы, как во фронте.

export type Scheme = 'light' | 'dark';
export type Palette = 'classic' | 'rose';

export type Colors = {
  // База
  paper: string;
  sheet: string;
  ink: string;
  blue: string;
  rule: string;
  tint: string;
  // Производные бумаги
  canvas: string;
  mist: string;
  smoke: string;
  slate: string;
  graphite: string;
  hatch: string;
  // Семантика
  danger: string;
  positive: string;
  gold: string;
  goldTint: string;
  goldOnInk: string;
  // Живая тренировка и отдых — одинаковы в любой теме и палитре
  live: string;
  liveDeep: string;
  liveInk: string;
  rest: string;
  restDeep: string;
  // Прочее
  input: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
};

const LIVE = { live: '#d1ffca', liveDeep: '#b4f5a8', liveInk: '#0a0a0a' };
const REST = { rest: '#ffdcae', restDeep: '#ffc98a' };

export const themes: Record<Palette, Record<Scheme, Colors>> = {
  classic: {
    light: {
      paper: '#fff8f1',
      sheet: '#fffdf9',
      ink: '#0a0a0a',
      blue: '#006eff',
      rule: '#e2e8f0',
      tint: 'rgba(0, 110, 255, 0.09)',
      canvas: '#f5eee8',
      mist: '#f3ece6',
      smoke: '#918989',
      slate: '#54544f',
      graphite: '#2f2f2d',
      hatch: '#c9c9be',
      danger: '#d92d20',
      positive: '#12893a',
      gold: '#a8720a',
      goldTint: 'rgba(168, 114, 10, 0.12)',
      goldOnInk: '#f2c14e',
      ...LIVE,
      ...REST,
      input: 'rgba(10, 10, 10, 0.25)',
      chart1: '#006eff',
      chart2: '#0a0a0a',
      chart3: '#73acf8',
      chart4: '#918989',
      chart5: '#e2e8f0',
    },
    dark: {
      paper: '#070d1a',
      sheet: '#0c1527',
      ink: '#fff8f1',
      blue: '#4c97ff',
      rule: '#1b2740',
      tint: 'rgba(76, 151, 255, 0.13)',
      canvas: '#111723',
      mist: '#131925',
      smoke: '#8f8e90',
      slate: '#b5b1b0',
      graphite: '#dad5d1',
      hatch: '#3e4049',
      danger: '#ff6b5e',
      positive: '#5ee08a',
      gold: '#f2c14e',
      goldTint: 'rgba(242, 193, 78, 0.12)',
      goldOnInk: '#a8720a',
      ...LIVE,
      ...REST,
      input: 'rgba(255, 248, 241, 0.25)',
      chart1: '#4c97ff',
      chart2: '#fff8f1',
      chart3: '#2d5998',
      chart4: '#8f8e90',
      chart5: '#1b2740',
    },
  },
  rose: {
    light: {
      paper: '#fff5f8',
      sheet: '#fffafc',
      ink: '#1f0a14',
      blue: '#d6246e',
      rule: '#f3dbe5',
      tint: 'rgba(214, 36, 110, 0.09)',
      canvas: '#f6ebef',
      mist: '#f6e9ec',
      smoke: '#9a8c8d',
      slate: '#625156',
      graphite: '#402d35',
      hatch: '#cec1c6',
      danger: '#c2410c',
      positive: '#12893a',
      gold: '#a8720a',
      goldTint: 'rgba(168, 114, 10, 0.12)',
      goldOnInk: '#f2c14e',
      ...LIVE,
      ...REST,
      input: 'rgba(31, 10, 20, 0.25)',
      chart1: '#d6246e',
      chart2: '#1f0a14',
      chart3: '#e882ac',
      chart4: '#9a8c8d',
      chart5: '#f3dbe5',
    },
    dark: {
      paper: '#1a0b14',
      sheet: '#241020',
      ink: '#fff5f8',
      blue: '#ff6fa8',
      rule: '#3a1e2f',
      tint: 'rgba(255, 111, 168, 0.13)',
      canvas: '#23141d',
      mist: '#25161d',
      smoke: '#988b91',
      slate: '#baaeb4',
      graphite: '#ded2d7',
      hatch: '#4c3e46',
      danger: '#ff8a5b',
      positive: '#5ee08a',
      gold: '#f2c14e',
      goldTint: 'rgba(242, 193, 78, 0.12)',
      goldOnInk: '#a8720a',
      ...LIVE,
      ...REST,
      input: 'rgba(255, 245, 248, 0.25)',
      chart1: '#ff6fa8',
      chart2: '#fff5f8',
      chart3: '#984265',
      chart4: '#988b91',
      chart5: '#3a1e2f',
    },
  },
};

// Типографика. Кегль/интерлиньяж/трекинг — из global.css (--text-*)
export type TextVariant =
  | 'caption'
  | 'body-sm'
  | 'body'
  | 'subheading'
  | 'subheading-lg'
  | 'heading-sm'
  | 'heading'
  | 'heading-lg'
  | 'display'
  | 'display-xl';

export const textVariants: Record<
  TextVariant,
  { fontSize: number; lineHeight: number; letterSpacing: number }
> = {
  caption: { fontSize: 12, lineHeight: 12 * 1.6, letterSpacing: -0.03 },
  'body-sm': { fontSize: 14, lineHeight: 14 * 1.3, letterSpacing: -0.011 },
  body: { fontSize: 16, lineHeight: 16 * 1.25, letterSpacing: -0.02 },
  subheading: { fontSize: 18, lineHeight: 18 * 1.33, letterSpacing: -0.02 },
  'subheading-lg': { fontSize: 20, lineHeight: 20 * 1.2, letterSpacing: -0.02 },
  'heading-sm': { fontSize: 28, lineHeight: 28 * 1.3, letterSpacing: -0.03 },
  heading: { fontSize: 40, lineHeight: 40 * 1.1, letterSpacing: -0.02 },
  'heading-lg': { fontSize: 48, lineHeight: 48 * 0.9, letterSpacing: -0.03 },
  display: { fontSize: 80, lineHeight: 80 * 0.9, letterSpacing: -0.03 },
  'display-xl': { fontSize: 130, lineHeight: 130 * 0.9, letterSpacing: -0.03 },
};

// Поле от края экрана — одно на все экраны, как --spacing-gutter во фронте
export const GUTTER = 12;

// Высоты
export const NAV_HEIGHT = 66;
export const LIVE_BAR_HEIGHT = 44;

export const getColors = (palette: Palette, scheme: Scheme): Colors => themes[palette][scheme];
