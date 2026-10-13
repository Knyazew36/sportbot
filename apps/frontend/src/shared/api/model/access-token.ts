import { emitSessionChange } from '@/shared/auth/session-events'
import { local, session } from '@/shared/lib/storage'

const ACCESS_TOKEN_KEY = 'access_token'

export const getAccessToken = (): string | null => local.get(ACCESS_TOKEN_KEY) ?? session.get(ACCESS_TOKEN_KEY)

/** remember=true — токен переживает закрытие браузера (localStorage), false — только вкладку (sessionStorage). */
export const setAccessToken = (token: string, remember = true): void => {
  if (remember) {
    local.set(ACCESS_TOKEN_KEY, token)
    session.remove(ACCESS_TOKEN_KEY)
  } else {
    session.set(ACCESS_TOKEN_KEY, token)
    local.remove(ACCESS_TOKEN_KEY)
  }
  emitSessionChange()
}

export const clearAccessToken = (): void => {
  local.remove(ACCESS_TOKEN_KEY)
  session.remove(ACCESS_TOKEN_KEY)
  emitSessionChange()
}
