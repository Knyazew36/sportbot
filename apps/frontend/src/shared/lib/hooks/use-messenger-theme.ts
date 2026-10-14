import { useTheme } from 'next-themes'

import { useEffect } from 'react'

import { getMessengerTheme, onMessengerThemeChange, paintMessengerChrome } from '@/shared/miniapp'

// Тема следует за мессенджером (frontend-tz, раздел 15). Мессенджер не сообщает тему — берём системную
export const useMessengerTheme = () => {
  const { setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    const sync = () => setTheme(getMessengerTheme() ?? 'system')
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
