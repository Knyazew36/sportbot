import { useEffect } from 'react';

import { addDatabaseChangeListener } from 'expo-sqlite';

import { queryClient } from '@/shared/api/query-client';
import { useLocalDb } from '@/shared/db';
import { LOCAL_ROOT } from '@/shared/local/local-query';

import { setActiveDb } from './engine';
import { LOCAL_REFRESH_MS } from './constants';
import { useSyncTriggers } from './use-sync-triggers';

/** Фоновый синк локальной базы — один на приложение, внутри DbProvider */
export const SyncRunner = () => {
  const db = useLocalDb();
  useSyncTriggers(db);

  useEffect(() => {
    setActiveDb(db);
    return () => setActiveDb(null);
  }, [db]);

  // Изменилась база — локальные запросы перечитываются. Транзакция pull шлёт событие на каждую
  // строку: собираем их в одно перечитывание
  useEffect(() => {
    if (!db) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const subscription = addDatabaseChangeListener(() => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        void queryClient.invalidateQueries({ queryKey: [LOCAL_ROOT] });
      }, LOCAL_REFRESH_MS);
    });
    return () => {
      subscription.remove();
      if (timer) clearTimeout(timer);
    };
  }, [db]);

  return null;
};
