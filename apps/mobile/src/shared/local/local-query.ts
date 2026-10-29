import { keepPreviousData, type QueryKey, useQuery } from '@tanstack/react-query';

import { type LocalDb, useLocalDb } from '@/shared/db';
import { useScreenFocused } from '@/shared/lib/hooks/use-screen-focused';

/** Все локальные запросы под одним корнем: изменение базы инвалидирует их разом */
export const LOCAL_ROOT = 'local';

/** Домен локального ключа — по нему SyncRunner перечитывает только экраны изменённых таблиц */
export const localDomainOf = (key: QueryKey): string | undefined => {
  if (key[0] !== LOCAL_ROOT) return undefined;
  const domain = key[1] === 'db' || key[1] === 'rest' ? key[2] : key[1];
  return typeof domain === 'string' ? domain : undefined;
};

type LocalQueryOptions<T> = {
  key: QueryKey;
  /**
   * Собрать ответ из базы. null — данных в базе ещё нет (первый запуск до снимка,
   * строка без серверного id): тогда ответ берётся у сервера, как раньше
   */
  read: (db: LocalDb) => T | null;
  fallback: () => Promise<T>;
  enabled?: boolean;
  /** Списки с фильтром: пока считается новая выборка, на экране остаётся прежняя */
  keepPrevious?: boolean;
};

/**
 * Запрос, который читает локальную базу, а не сервер — экран работает без сети.
 * Форма результата — обычный useQuery: QueryState и страницы не меняются.
 * Свежесть держит синк: изменение таблицы перечитывает ключи её домена (SyncRunner)
 */
export const useLocalQuery = <T>({ key, read, fallback, enabled = true, keepPrevious = false }: LocalQueryOptions<T>) => {
  const db = useLocalDb();
  const focused = useScreenFocused();
  return useQuery({
    // Источник в ключе: открылась база — запрос переключится на неё, не дожидаясь синка
    queryKey: [LOCAL_ROOT, db ? 'db' : 'rest', ...key],
    queryFn: () => {
      const local = db && read(db);
      if (local != null) return local;
      // В зале без сети этот запрос упадёт: видно, какие экраны ещё зависят от сервера
      if (__DEV__) console.log(`[local] чтение ушло на сервер: ${JSON.stringify(key)}${db ? '' : ', база не открыта'}`);
      return fallback();
    },
    // Вкладки и экраны под верхним смонтированы все: без отписки каждая правка перечитывала бы и их.
    // Помеченный устаревшим запрос перечитается, когда экран снова окажется на виду
    subscribed: focused,
    // Чтение базы телефона сети не ждёт: без связи экран открывается из базы сразу
    networkMode: 'offlineFirst',
    enabled,
    // Перечитывает синк, а не фокус экрана: база на телефоне и так свежее некуда
    staleTime: Infinity,
    placeholderData: keepPrevious ? keepPreviousData : undefined,
  });
};
