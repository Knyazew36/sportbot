import { errorCatch } from '@front-cmdt/utils/error-catch'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'

import {
  getAccessToken,
  getApiErrorStatus,
  hasFieldErrors,
  isRetryableError,
  PERSIST_GC_TIME,
  subscribeSession,
} from '@sportbot/api/client'

import { local } from '@/shared/lib/storage'
import { getMiniappUserKey, haptic } from '@/shared/miniapp'
import { toast } from '@/shared/ui/shadcn/toast'

const DEFAULT_SUCCESS = 'Готово'

const errorText = (error: unknown) => String(errorCatch(error) || 'Не удалось выполнить запрос. Попробуйте ещё раз')

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Первая загрузка показывает ошибку на самом экране с кнопкой «Повторить».
    // Тост нужен, только когда на экране уже старые данные и молча не обновились
    // Сетевой сбой фонового обновления не тостим: в зале он каждые пять минут, а данные на экране и так есть
    onError: (error, query) => {
      if (query.state.data !== undefined && getApiErrorStatus(error) !== undefined)
        toast.add({ title: errorText(error), type: 'error' })
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
      retry: (failureCount, error) => failureCount < 1 && isRetryableError(error),
      // Бот и приложение правят одни данные: после возврата в приложение экран перечитывается (frontend-tz, 4.1)
      refetchOnWindowFocus: true,
      staleTime: 30_000,
    },
  },
})

const persister = createSyncStoragePersister({
  key: 'query-cache',
  storage: { getItem: local.get, setItem: local.set, removeItem: local.remove },
  // Подход, записанный за секунду до закрытия приложения, тоже должен успеть сохраниться
  throttleTime: 200,
})

// В хранилище только помеченное (meta.persist): чтобы в зале без сети открыть приложение, дойти до
// тренировки и не потерять неотправленные подходы. Вызывать после initMiniapp: нужен аккаунт
export const getPersistOptions = (): Omit<PersistQueryClientOptions, 'queryClient'> => ({
  persister,
  maxAge: PERSIST_GC_TIME,
  // Другой аккаунт на том же телефоне не получит чужую тренировку и очередь
  buster: getMiniappUserKey() ?? '',
  dehydrateOptions: {
    shouldDehydrateQuery: query => Boolean(query.meta?.persist) && query.state.status === 'success',
    shouldDehydrateMutation: mutation => Boolean(mutation.meta?.persist) && mutation.state.status === 'pending',
  },
})

/**
 * Очередь после восстановления из хранилища: стоявшие на паузе и те, что были в полёте при закрытии.
 * Без сети continue() сам встанет на паузу и продолжит, когда она появится
 */
export const resumePersistedMutations = () => {
  queryClient
    .getMutationCache()
    .getAll()
    .filter(mutation => mutation.state.status === 'pending')
    .forEach(mutation => void mutation.continue().catch(() => undefined))
}

// Выход или протухший токен: кеш прошлого пользователя не должен достаться следующему
subscribeSession(() => {
  if (getAccessToken()) return
  queryClient.clear()
  void persister.removeClient()
})
