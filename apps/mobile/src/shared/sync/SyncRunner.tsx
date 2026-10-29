import { useEffect } from 'react';

import { addDatabaseChangeListener } from 'expo-sqlite';

import { queryClient } from '@/shared/api/query-client';
import { useLocalDb } from '@/shared/db';
import { LOCAL_ROOT, localDomainOf } from '@/shared/local/local-query';

import { requestPush, setActiveDb } from './engine';
import { LOCAL_REFRESH_MS } from './constants';
import { SILENT_TABLES, TABLE_DOMAINS } from './table-domains';
import { useSyncTriggers } from './use-sync-triggers';

/** Фоновый синк локальной базы — один на приложение, внутри DbProvider */
export const SyncRunner = () => {
  const db = useLocalDb();
  useSyncTriggers(db);

  useEffect(() => {
    setActiveDb(db);
    return () => setActiveDb(null);
  }, [db]);

  // Изменилась база — перечитываются только экраны изменённых таблиц. Транзакция pull шлёт событие
  // на каждую строку: собираем их в одно перечитывание
  useEffect(() => {
    if (!db) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tables = new Set<string>();
    const subscription = addDatabaseChangeListener(({ tableName }) => {
      if (SILENT_TABLES.has(tableName)) return;
      // Новая операция в очереди — отправить её, когда правки притихнут
      if (tableName === 'outbox') requestPush();
      tables.add(tableName);
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        const changed = [...tables];
        tables.clear();
        // Таблица, которой нет в карте, — перечитать всё: новая таблица не должна оставить экран со старым
        if (changed.some((table) => !TABLE_DOMAINS[table])) {
          void queryClient.invalidateQueries({ queryKey: [LOCAL_ROOT] });
          return;
        }
        const domains = new Set(changed.flatMap((table) => TABLE_DOMAINS[table]!));
        void queryClient.invalidateQueries({
          predicate: ({ queryKey }) => {
            const domain = localDomainOf(queryKey);
            return domain !== undefined && domains.has(domain);
          },
        });
      }, LOCAL_REFRESH_MS);
    });
    return () => {
      subscription.remove();
      if (timer) clearTimeout(timer);
    };
  }, [db]);

  return null;
};
