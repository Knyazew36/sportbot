import { errorCatch } from '@front-cmdt/utils/error-catch'
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { subscribeSession } from '@/shared/auth/session-events'
import { haptic } from '@/shared/miniapp'
import { toast } from '@/shared/ui/shadcn/toast'

import { getAccessToken } from './model/access-token'
import { getApiErrorStatus, hasFieldErrors } from './model/api-error'

// Единые договорённости о тостах (CLAUDE.md, «Запросы»): хуки не пишут onError/onSuccess ради уведомлений
declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Текст тоста об успехе. Без него и без skipSuccessToast покажется общий «Готово» */
      successMessage?: string
      /** Успех и так виден на экране — тост не нужен. Рядом с флагом — комментарий почему */
      skipSuccessToast?: boolean
      /** 422 с ошибками полей показывается под инпутами формы, тост не дублируется */
      inlineFieldErrors?: boolean
    }
  }
}

const DEFAULT_SUCCESS = 'Готово'

const errorText = (error: unknown) => String(errorCatch(error) || 'Не удалось выполнить запрос. Попробуйте ещё раз')

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Первая загрузка показывает ошибку на самом экране с кнопкой «Повторить».
    // Тост нужен, только когда на экране уже старые данные и молча не обновились
    onError: (error, query) => {
      if (query.state.data !== undefined) toast.add({ title: errorText(error), type: 'error' })
    },
  }),
  mutationCache: new MutationCache({
    // Вибрация вместе с тостом: результат действия ощущается, даже если тост не заметили.
    // Ошибки полей формы тоже отзываются — тоста там нет, но действие не прошло
    onError: (error, _vars, _ctx, mutation) => {
      haptic.error()
      if (mutation.meta?.inlineFieldErrors && hasFieldErrors(error)) return
      toast.add({ title: errorText(error), type: 'error' })
    },
    onSuccess: (_data, _vars, _ctx, mutation) => {
      if (mutation.meta?.skipSuccessToast) return
      haptic.success()
      toast.add({ title: mutation.meta?.successMessage ?? DEFAULT_SUCCESS, type: 'success' })
    },
  }),
  defaultOptions: {
    queries: {
      // Ошибки клиента (нет прав, не найдено, не авторизован) повтор не исправит
      retry: (failureCount, error) => {
        const status = getApiErrorStatus(error)
        return failureCount < 1 && (status === undefined || status >= 500)
      },
      // Бот и приложение правят одни данные: после возврата в приложение экран перечитывается (frontend-tz, 4.1)
      refetchOnWindowFocus: true,
      staleTime: 30_000,
    },
  },
})

// Выход или протухший токен: кеш прошлого пользователя не должен достаться следующему
subscribeSession(() => {
  if (!getAccessToken()) queryClient.clear()
})
