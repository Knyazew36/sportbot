import { log } from '@front-cmdt/utils/log'
import { configureApi } from '@sportbot/api/client'

import { getMiniappAuthorization } from '@/shared/miniapp'

import { apiDomain } from './model/constants'
import { webTokenStore } from './model/web-token-store'

// Подключение общего API-клиента к вебу: до первого запроса, поэтому импортируется первым в main.tsx
configureApi({
  baseURL: apiDomain,
  tokens: webTokenStore,
  // В мини-приложении мессенджера токена нет — сервер авторизует по подписанным данным запуска
  fallbackAuthorization: getMiniappAuthorization,
  // Логин/логаут в соседней вкладке меняет localStorage — ловим через storage-событие
  subscribeExternal: callback => {
    window.addEventListener('storage', callback)
    return () => window.removeEventListener('storage', callback)
  },
  // Лог запросов в консоль браузера и на проде: по нему разбираем проблемы у пользователей в мессенджере
  log,
})
