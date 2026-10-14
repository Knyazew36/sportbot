import { useTheme } from 'next-themes'

import { useEffect } from 'react'

import { getMessengerTheme, onMessengerThemeChange } from '@/shared/miniapp'

// Тема следует за мессенджером (frontend-tz, раздел 15). Мессенджер не сообщает тему — берём системную
export const useMessengerTheme = () => {
  const { setTheme } = useTheme()

  useEffect(() => {
    const sync = () => setTheme(getMessengerTheme() ?? 'system')
    sync()
    return onMessengerThemeChange(sync)
  }, [setTheme])
}
