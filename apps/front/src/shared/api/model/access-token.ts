import {
  getFromLocalStorage,
  removeFromLocalStorage,
  saveToLocalStorage,
  getFromSessionStorage,
  removeFromSessionStorage,
  saveToSessionStorage,
} from '@/shared/utils'
import { emitSessionChange } from '@/shared/auth/session-events'

const ACCESS_TOKEN_KEY = 'access_token'

export const getAccessToken = (): string | null =>
  getFromLocalStorage(ACCESS_TOKEN_KEY) ?? getFromSessionStorage(ACCESS_TOKEN_KEY)

/** remember=true — токен переживает закрытие браузера (localStorage), false — только вкладку (sessionStorage). */
export const setAccessToken = (token: string, remember = true): void => {
  if (remember) {
    saveToLocalStorage(ACCESS_TOKEN_KEY, token)
    removeFromSessionStorage(ACCESS_TOKEN_KEY)
  } else {
    saveToSessionStorage(ACCESS_TOKEN_KEY, token)
    removeFromLocalStorage(ACCESS_TOKEN_KEY)
  }
  emitSessionChange()
}

export const clearAccessToken = (): void => {
  removeFromLocalStorage(ACCESS_TOKEN_KEY)
  removeFromSessionStorage(ACCESS_TOKEN_KEY)
  emitSessionChange()
}
