import { useTheme } from 'next-themes'

import { useCallback, useEffect, useState } from 'react'

import { getMessengerTheme, onMessengerThemeChange, paintMessengerChrome } from '@/shared/miniapp'

/** auto — как в мессенджере; light / dark — выбор в профиле поверх мессенджера */
export type ThemeChoice = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'sb-theme-choice'

// Выбор живёт на устройстве: это удобство конкретного телефона, а не настройка аккаунта.
// Хранилище может быть недоступно (приватный режим, вебвью) — тогда просто «как в мессенджере»
const readChoice = (): ThemeChoice => {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'auto'
  } catch {
    return 'auto'
  }
}

const saveChoice = (choice: ThemeChoice) => {
  try {
    if (choice === 'auto') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    // Не сохранилось — выбор продержится до перезапуска
  }
}

const resolve = (choice: ThemeChoice) => (choice === 'auto' ? (getMessengerTheme() ?? 'system') : choice)

// Тема следует за мессенджером (frontend-tz, раздел 15), пока в профиле не выбрана своя.
// Мессенджер не сообщает тему — берём системную
export const useMessengerTheme = () => {
  const { setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    const sync = () => setTheme(resolve(readChoice()))
    sync()
    return onMessengerThemeChange(sync)
  }, [setTheme])

  // Окно мессенджера в цвет бумаги приложения. Цвет берём из CSS, чтобы палитра жила в одном месте (global.css);
  // кадр ждём, потому что next-themes вешает класс .dark в своём эффекте — он может отработать позже нашего
  useEffect(() => {
    if (!resolvedTheme) return
    const frame = requestAnimationFrame(() => {
      const paper = getComputedStyle(document.documentElement).getPropertyValue('--sb-paper').trim()
      if (paper) paintMessengerChrome(paper)
    })
    return () => cancelAnimationFrame(frame)
  }, [resolvedTheme])
}

/** Выбор темы для профиля: применяется сразу и запоминается на устройстве */
export const useThemeChoice = () => {
  const { setTheme } = useTheme()
  const [choice, setChoice] = useState<ThemeChoice>(readChoice)

  const change = useCallback(
    (next: ThemeChoice) => {
      saveChoice(next)
      setChoice(next)
      setTheme(resolve(next))
    },
    [setTheme],
  )

  return [choice, change] as const
}
