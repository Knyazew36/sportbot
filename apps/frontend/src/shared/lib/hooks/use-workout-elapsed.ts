import { useEffect, useState } from 'react'

const pad = (n: number) => String(n).padStart(2, '0')

const formatElapsed = (totalSeconds: number) => {
  // Нераспознанное время начала — прочерк, а не «NaN:NaN» на весь экран
  if (!Number.isFinite(totalSeconds)) return '--:--'
  const s = Math.max(0, totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`
}

const secondsSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 1000)

// Общее время тренировки строкой «мм:сс» / «ч:мм:сс». Считаем от startedAt сервера, а не от монтирования:
// после перезахода в Mini App время не сбрасывается
export const useWorkoutElapsed = (startedAt: string) => {
  const [seconds, setSeconds] = useState(() => secondsSince(startedAt))

  useEffect(() => {
    setSeconds(secondsSince(startedAt))
    const id = setInterval(() => setSeconds(secondsSince(startedAt)), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  return formatElapsed(seconds)
}
