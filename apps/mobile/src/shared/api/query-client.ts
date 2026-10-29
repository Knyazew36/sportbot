import { errorCatch } from '@front-cmdt/utils/error-catch';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import {
  focusManager,
  MutationCache,
  onlineManager,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';
import { AppState } from 'react-native';
import { toast } from 'sonner-native';

import {
  getAccessToken,
  getApiErrorStatus,
  hasFieldErrors,
  isRetryableError,
  PERSIST_GC_TIME,
  subscribeSession,
} from '@sportbot/api/client';

import { haptic } from '@/shared/lib/haptics';
import { storage } from '@/shared/lib/storage';
import { requestSync } from '@/shared/sync/engine';
import { isSessionExpired } from './model/session-expired';
import { clearSessionUserId, getSessionUserId, setSessionUserId } from './model/session-user';

const DEFAULT_SUCCESS = 'Готово';

const errorText = (error: unknown) =>
  String(errorCatch(error) || 'Не удалось выполнить запрос. Попробуйте ещё раз');

// refetchOnWindowFocus веба — здесь перечитывание при возврате в приложение
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') handleFocus(true);
  });
  return () => subscription.remove();
});

// Онлайн из expo-network: без сети persist-мутации встают на паузу и доезжают, когда она появится
onlineManager.setEventListener((setOnline) => {
  void getNetworkStateAsync().then((state) => setOnline(state.isConnected ?? false));
  const subscription = addNetworkStateListener((state) => setOnline(state.isConnected ?? false));
  return () => subscription.remove();
});

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Тост нужен, только когда на экране уже старые данные и молча не обновились.
    // Сетевой сбой фонового обновления не тостим: в зале он каждые пять минут, данные на экране и так есть.
    // Сессия закончилась — 401 у каждого запроса, об этом и так говорит плашка «Войти»
    onError: (error, query) => {
      if (isSessionExpired()) return;
      if (query.state.data !== undefined && getApiErrorStatus(error) !== undefined)
        toast.error(errorText(error));
    },
  }),
  mutationCache: new MutationCache({
    // Вибрация вместе с тостом: результат действия ощущается, даже если тост не заметили
    onError: (error, _vars, _ctx, mutation) => {
      haptic.error();
      if (mutation.meta?.inlineFieldErrors && hasFieldErrors(error)) return;
      toast.error(errorText(error));
    },
    onSuccess: (_data, _vars, _ctx, mutation) => {
      // Правка ушла на сервер мимо локальной базы — экраны, читающие базу, увидят её после pull.
      // Локальная уже на экране, а на сервер её отправит очередь: pull после каждого подхода и тормозил онлайн
      if (!mutation.meta?.local) requestSync();
      if (mutation.meta?.skipSuccessToast) return;
      haptic.success();
      toast.success(mutation.meta?.successMessage ?? DEFAULT_SUCCESS);
    },
  }),
  defaultOptions: {
    mutations: {
      // Приложение локальное: правки пишутся в базу телефона и не ждут сеть — в зале без связи
      // старт тренировки и подходы проходят сразу, на сервер уходит синком. Исключения —
      // серверные действия (публикация, «поделиться») помечают networkMode: 'online' сами
      networkMode: 'offlineFirst',
    },
    queries: {
      // Ошибки клиента (нет прав, не найдено, не авторизован) повтор не исправит
      retry: (failureCount, error) => failureCount < 1 && isRetryableError(error),
      // Бот и приложение правят одни данные: после возврата в приложение экран перечитывается
      refetchOnWindowFocus: true,
      staleTime: 30_000,
    },
  },
});

// MMKV синхронный, createAsyncStoragePersister принимает MaybePromise — оборачиваем напрямую
const persister = createAsyncStoragePersister({
  key: 'query-cache',
  storage: {
    getItem: (key) => storage.getString(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => {
      storage.remove(key);
    },
  },
  // Подход, записанный за секунду до закрытия приложения, тоже должен успеть сохраниться
  throttleTime: 200,
});

// В хранилище только помеченное (meta.persist): в зале без сети открыть приложение,
// дойти до тренировки и не потерять неотправленные подходы
export const getPersistOptions = (): Omit<PersistQueryClientOptions, 'queryClient'> => ({
  persister,
  maxAge: PERSIST_GC_TIME,
  // Постоянное значение: прежние версии писали именно его, смена сбросила бы неотправленную очередь
  // при обновлении. Чужой аккаунт отсекает bindSessionUser, а не buster
  buster: 'user:',
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => Boolean(query.meta?.persist) && query.state.status === 'success',
    shouldDehydrateMutation: (mutation) =>
      Boolean(mutation.meta?.persist) && mutation.state.status === 'pending',
  },
});

/**
 * Очередь после восстановления из хранилища: стоявшие на паузе и те, что были в полёте при закрытии.
 * Без сети continue() сам встанет на паузу и продолжит, когда она появится
 */
export const resumePersistedMutations = () => {
  queryClient
    .getMutationCache()
    .getAll()
    .filter((mutation) => mutation.state.status === 'pending')
    .forEach((mutation) => void mutation.continue().catch(() => undefined));
};

const clearAll = () => {
  clearSessionUserId();
  queryClient.clear();
  void persister.removeClient();
};

// Выход — кеш прошлого пользователя не должен достаться следующему.
// Протухший токен — не выход: неотправленные подходы ждут повторного входа (повтор на 401 в очереди)
subscribeSession((reason) => {
  if (getAccessToken() || reason === 'expired') return;
  clearAll();
});

/**
 * Профиль загружен — кому принадлежат кеш и очередь. После протухшего токена вошли другим
 * аккаунтом: чужая тренировка и очередь выбрасываются, иначе они ушли бы на сервер от его имени
 */
export const bindSessionUser = (userId: number) => {
  const previous = getSessionUserId();
  if (previous === String(userId)) return;
  if (previous) {
    queryClient.getMutationCache().clear();
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'sport-user' });
  }
  setSessionUserId(userId);
};
