// Оси темы. Сами цвета — в src/global.css (темы Uniwind), здесь только типы и имена тем.
// Палитра (classic | rose) — отдельная ось от светлой/тёмной схемы, как во фронте

export type Scheme = 'light' | 'dark';
export type Palette = 'classic' | 'rose';

/** Тема Uniwind из пары «палитра × схема»: синяя — штатные light/dark, розовая — rose-light/rose-dark */
export type ThemeName = Scheme | `rose-${Scheme}`;

export const themeName = (palette: Palette, scheme: Scheme): ThemeName =>
  palette === 'rose' ? `rose-${scheme}` : scheme;

/** Поле от края экрана, px — тот же --spacing-gutter, что в global.css. Для расчётов в JS (прокрутка лент) */
export const GUTTER = 12;
