import type { Palette, ThemeChoice } from '@/shared/theme/tokens';

// Палитры и схема оформления — порт features/change-theme/options.ts
export const PALETTES: { value: Palette; label: string }[] = [
  { value: 'classic', label: 'Синяя' },
  { value: 'rose', label: 'Розовая' },
];

export const THEME_OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'auto', label: 'Авто' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
];
