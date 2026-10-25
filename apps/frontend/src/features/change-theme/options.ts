import type { ThemeChoice } from '@/shared/lib/hooks/use-messenger-theme'
import type { Palette } from '@/shared/lib/hooks/use-palette'

export const PALETTES: { value: Palette; label: string }[] = [
  { value: 'classic', label: 'Синяя' },
  { value: 'rose', label: 'Розовая' },
]

export const THEME_OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'auto', label: 'Авто' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
]
