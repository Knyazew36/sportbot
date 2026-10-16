import { useEffect, useState } from 'react'

const read = (key?: string): number | null => {
  if (!key) return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? Number(raw) || null : null
  } catch {
    return null
  }
}

const write = (key: string | undefined, startedAt: number | null) => {
  if (!key) return
  try {
    if (startedAt === null) localStorage.removeItem(key)
    else localStorage.setItem(key, String(startedAt))
  } catch {
    // хранилище недоступно — секундомер живёт до перезагрузки страницы
  }
}

/**
 * Секундомер от момента старта, а не по тикам: свёрнутое приложение или погасший экран отсчёт не сбивают.
 * С storageKey переживает перезагрузку
 */
export const useStopwatch = ({ storageKey }: { storageKey?: string } = {}) => {
  const [startedAt, setStartedAt] = useState<number | null>(() => read(storageKey))
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [startedAt])

  const update = (next: number | null) => {
    setStartedAt(next)
    setNow(Date.now())
    write(storageKey, next)
  }

  return {
    running: startedAt !== null,
    elapsed: startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000)),
    start: () => update(Date.now()),
    stop: () => update(null),
  }
}
