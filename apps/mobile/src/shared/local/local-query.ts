import { keepPreviousData, type QueryKey, useQuery } from '@tanstack/react-query';

import { type LocalDb, useLocalDb } from '@/shared/db';

/** Все локальные запросы под одним корнем: изменение базы инвалидирует их разом */
export const LOCAL_ROOT = 'local';

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
 * Свежесть держит синк: после каждого pull ключи LOCAL_ROOT перечитываются (SyncRunner)
 */
export const useLocalQuery = <T>({ key, read, fallback, enabled = true, keepPrevious = false }: LocalQueryOptions<T>) => {
  const db = useLocalDb();
  return useQuery({
    // Источник в ключе: открылась база — запрос переключится на неё, не дожидаясь синка
    queryKey: [LOCAL_ROOT, db ? 'db' : 'rest', ...key],
    queryFn: () => (db && read(db)) ?? fallback(),
    enabled,
    // Перечитывает синк, а не фокус экрана: база на телефоне и так свежее некуда
    staleTime: Infinity,
    placeholderData: keepPrevious ? keepPreviousData : undefined,
  });
};
