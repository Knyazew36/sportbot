import type { Palette } from '@/shared/theme/tokens';

// Палитры оформления — порт features/change-theme/options.ts.
// Светлая/тёмная схема в мобилке следует за системой, поэтому выбора темы здесь нет
export const PALETTES: { value: Palette; label: string }[] = [
  { value: 'classic', label: 'Синяя' },
  { value: 'rose', label: 'Розовая' },
];
