import { useCallback, useState } from 'react'

import { repaintMessengerChrome } from './use-messenger-theme'

/** classic — синяя расцветка Спортбота; rose — розовая. Ось независима от светлой/тёмной темы */
export type Palette = 'classic' | 'rose'

export type Gender = 'MALE' | 'FEMALE'

/** Расцветка по полу: выбор пола сразу перекрашивает, ручной выбор расцветки потом её переопределяет */
export const paletteForGender = (gender: Gender): Palette => (gender === 'FEMALE' ? 'rose' : 'classic')

// Ключ читает и inline-скрипт в index.html — менять вместе
const STORAGE_KEY = 'sb-palette'

// Как и тема, расцветка живёт на устройстве. Хранилище может быть недоступно — тогда синяя
const readPalette = (): Palette => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'rose' ? 'rose' : 'classic'
  } catch {
    return 'classic'
  }
}

const savePalette = (palette: Palette) => {
  try {
    if (palette === 'classic') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, palette)
  } catch {
    // Не сохранилось — расцветка продержится до перезапуска
  }
}

const applyPalette = (palette: Palette) => {
  const root = document.documentElement
  if (palette === 'classic') delete root.dataset.palette
  else root.dataset.palette = palette
}

/** Выбор расцветки для профиля: применяется сразу и запоминается на устройстве */
export const usePaletteChoice = () => {
  const [palette, setPalette] = useState<Palette>(readPalette)

  const change = useCallback((next: Palette) => {
    savePalette(next)
    applyPalette(next)
    setPalette(next)
    repaintMessengerChrome()
  }, [])

  return [palette, change] as const
}
