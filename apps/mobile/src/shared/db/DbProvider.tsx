import { createContext, type ReactNode, useContext, useEffect, useMemo } from 'react';

import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { type LocalDb, openLocalDb } from './client';
import migrations from './migrations/migrations';

const DbContext = createContext<LocalDb | null>(null);

/**
 * Локальная база пользователя — готова после миграций. Экран не ждёт её: пока страницы читают
 * через REST-хуки, сбой миграции не должен закрыть приложение, без базы работает как раньше
 */
export const DbProvider = ({ userId, children }: { userId: number; children: ReactNode }) => {
  const db = useMemo(() => openLocalDb(userId), [userId]);
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (error && __DEV__) console.warn(`[db] миграция не применилась, userId=${userId}`, error);
  }, [error, userId]);

  return <DbContext.Provider value={success ? db : null}>{children}</DbContext.Provider>;
};

/** null — база ещё открывается или миграция упала */
export const useLocalDb = (): LocalDb | null => useContext(DbContext);
