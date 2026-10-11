import { useSyncExternalStore } from 'react'
import { getAccessToken } from '@/shared/api/model/access-token'
import { subscribeSession } from './session-events'

const subscribe = (callback: () => void) => {
  const unsubscribe = subscribeSession(callback)
  // Логин/логаут в соседней вкладке меняет localStorage — ловим через storage-событие
  window.addEventListener('storage', callback)
  return () => {
    unsubscribe()
    window.removeEventListener('storage', callback)
  }
}

const getSnapshot = () => !!getAccessToken()

export const useIsAuthenticated = (): boolean => useSyncExternalStore(subscribe, getSnapshot)
