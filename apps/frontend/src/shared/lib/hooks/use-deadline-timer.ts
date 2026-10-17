import { useCallback, useEffect, useRef, useState } from 'react'

type TimerState =
  | { status: 'idle' }
  | { status: 'running'; endsAt: number; total: number }
  | { status: 'paused'; left: number; total: number }

const read = (key?: string): TimerState => {
  if (!key) return { status: 'idle' }
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as TimerState) : { status: 'idle' }
  } catch {
    return { status: 'idle' }
  }
}

const write = (key: string | undefined, state: TimerState) => {
  if (!key) return
  try {
    if (state.status === 'idle') localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(state))
  } catch {
    // хранилище недоступно — таймер живёт до перезагрузки страницы
  }
}

type Options = {
  /** Ключ localStorage: таймер переживает перезагрузку и сворачивание приложения */
  storageKey?: string
  /** Сработает один раз, когда время вышло при открытом приложении */
  onEnd?: () => void
}

/**
 * Таймер от момента старта, а не по тикам: свёрнутое приложение, погасший экран или переход на другой экран
 * отсчёт не сбивают (frontend-tz, 8.3). left < 0 — время вышло столько секунд назад
 */
export const useDeadlineTimer = ({ storageKey, onEnd }: Options = {}) => {
  const [state, setState] = useState<TimerState>(() => read(storageKey))
  // Ключ появился позже (id тренировки догрузился) — перечитываем хранилище, иначе таймер так и останется пустым
  const [readKey, setReadKey] = useState(storageKey)
  if (readKey !== storageKey) {
    setReadKey(storageKey)
    setState(read(storageKey))
  }
  const [now, setNow] = useState(() => Date.now())
  const endedRef = useRef(false)
  const onEndRef = useRef(onEnd)
  useEffect(() => {
    onEndRef.current = onEnd
  }, [onEnd])

  const update = useCallback(
    (next: TimerState) => {
      endedRef.current = false
      setState(next)
      setNow(Date.now())
      write(storageKey, next)
    },
    [storageKey],
  )

  const left =
    state.status === 'running'
      ? Math.ceil((state.endsAt - now) / 1000)
      : state.status === 'paused'
        ? state.left
        : 0

  useEffect(() => {
    if (state.status !== 'running') return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [state.status])

  useEffect(() => {
    if (state.status !== 'running' || left > 0 || endedRef.current) return
    endedRef.current = true
    onEndRef.current?.()
  }, [left, state.status])

  // Доля оставшегося по миллисекундам: left округлён до секунды вверх, и кольцо по нему шагало бы с отставанием
  const fraction =
    state.status === 'running'
      ? Math.min(1, Math.max(0, (state.endsAt - now) / (state.total * 1000)))
      : state.status === 'paused' && state.total
        ? state.left / state.total
        : 0

  return {
    status: state.status,
    left,
    fraction,
    total: state.status === 'idle' ? 0 : state.total,
    start: (seconds: number) => update({ status: 'running', endsAt: Date.now() + seconds * 1000, total: seconds }),
    add: (seconds: number) => {
      if (state.status === 'running')
        update({ ...state, endsAt: Math.max(state.endsAt, Date.now()) + seconds * 1000, total: state.total + seconds })
    },
    pause: () => {
      if (state.status === 'running') update({ status: 'paused', left: Math.max(left, 0), total: state.total })
    },
    resume: () => {
      if (state.status === 'paused')
        update({ status: 'running', endsAt: Date.now() + state.left * 1000, total: state.total })
    },
    stop: () => update({ status: 'idle' }),
  }
}

/** «02:15» */
export const formatSeconds = (seconds: number) => {
  const s = Math.max(0, seconds)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
