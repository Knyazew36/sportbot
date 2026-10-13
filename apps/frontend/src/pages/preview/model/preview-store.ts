import { useSyncExternalStore } from 'react'

// Хранилище в памяти превью: состояние, общее для нескольких экранов, пока нет API.
// После перезагрузки страницы сбрасывается к мокам — для макета это нормально
export const createPreviewStore = <T>(initial: T) => {
  let state = initial
  const listeners = new Set<() => void>()

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const set = (update: (prev: T) => T) => {
    state = update(state)
    listeners.forEach(l => l())
  }

  // Снимок — именованная функция фабрики: инлайн-стрелку React Compiler выносит из замыкания, и state теряется
  const getSnapshot = () => state

  const useStore = () => useSyncExternalStore(subscribe, getSnapshot)

  return { set, useStore }
}
