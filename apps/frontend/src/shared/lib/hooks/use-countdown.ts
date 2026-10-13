import { useEffect, useState } from 'react'

/**
 * Обратный отсчёт по секундам для макета: удержание растяжки, отдых между подходами.
 * Настоящий таймер тренировки считает от момента старта, чтобы свёрнутое приложение не сбивало его (frontend-tz, 8.3)
 */
export const useCountdown = (initial: number, { paused = false }: { paused?: boolean } = {}) => {
  const [left, setLeft] = useState(initial)

  useEffect(() => {
    if (paused || left <= 0) return
    const t = setTimeout(() => setLeft(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [left, paused])

  return [left, setLeft] as const
}
