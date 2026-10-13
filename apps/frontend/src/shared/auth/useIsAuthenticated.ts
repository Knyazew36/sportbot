import { useSyncExternalStore } from 'react'

import { getAccessToken } from '@/shared/api/model/access-token'
import { getMiniappAuthorization } from '@/shared/miniapp'

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

// В мини-приложении мессенджера токена нет: личность подтверждают данные запуска
export const isAuthenticated = (): boolean => !!getAccessToken() || !!getMiniappAuthorization()

export const useIsAuthenticated = (): boolean => useSyncExternalStore(subscribe, isAuthenticated)
