import { QueryClient } from '@tanstack/react-query'

import { subscribeSession } from '@/shared/auth/session-events'

import { getAccessToken } from './model/access-token'
import { getApiErrorStatus } from './model/api-error'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Ошибки клиента (нет прав, не найдено, не авторизован) повтор не исправит
      retry: (failureCount, error) => {
        const status = getApiErrorStatus(error)
        return failureCount < 1 && (status === undefined || status >= 500)
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

// Выход или протухший токен: кеш прошлого пользователя не должен достаться следующему
subscribeSession(() => {
  if (!getAccessToken()) queryClient.clear()
})
