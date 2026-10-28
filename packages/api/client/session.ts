import { useSyncExternalStore } from 'react'

import { getApiConfig } from './config'
import { emitSessionChange, subscribeSession, type SessionChangeReason } from './session-events'

export const getAccessToken = (): string | null => getApiConfig().tokens.get()

export const setAccessToken = (
  token: string,
  remember = true,
  reason: Extract<SessionChangeReason, 'login' | 'refresh'> = 'login',
): void => {
  getApiConfig().tokens.set(token, remember)
  emitSessionChange(reason)
}

export const clearAccessToken = (reason: Exclude<SessionChangeReason, 'login'> = 'logout'): void => {
  getApiConfig().tokens.clear()
  emitSessionChange(reason)
}

/** Есть токен или авторизация без него (данные запуска мини-приложения) */
export const isAuthenticated = (): boolean => !!getAccessToken() || !!getApiConfig().fallbackAuthorization?.()

const subscribe = (callback: () => void) => {
  const unsubscribe = subscribeSession(callback)
  const unsubscribeExternal = getApiConfig().subscribeExternal?.(callback)
  return () => {
    unsubscribe()
    unsubscribeExternal?.()
  }
}

export const useIsAuthenticated = (): boolean => useSyncExternalStore(subscribe, isAuthenticated)
