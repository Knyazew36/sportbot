import type { TokenStore } from '@sportbot/api/client'

import { local, session } from '@/shared/lib/storage'

const ACCESS_TOKEN_KEY = 'access_token'

/** remember=true — токен переживает закрытие браузера (localStorage), false — только вкладку (sessionStorage) */
export const webTokenStore: TokenStore = {
  get: () => local.get(ACCESS_TOKEN_KEY) ?? session.get(ACCESS_TOKEN_KEY),
  set: (token, remember = true) => {
    if (remember) {
      local.set(ACCESS_TOKEN_KEY, token)
      session.remove(ACCESS_TOKEN_KEY)
    } else {
      session.set(ACCESS_TOKEN_KEY, token)
      local.remove(ACCESS_TOKEN_KEY)
    }
  },
  clear: () => {
    local.remove(ACCESS_TOKEN_KEY)
    session.remove(ACCESS_TOKEN_KEY)
  },
}
