import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export type LocalDb = ExpoSQLiteDatabase<typeof schema>;

const opened = new Map<number, LocalDb>();

// Файл на пользователя: вход другим аккаунтом не смешивает данные, а база прошлого
// с неотправленными правками остаётся на диске до его возвращения
const fileOf = (userId: number) => `sportbot-${userId}.db`;

/**
 * База пользователя. Открывается один раз за запуск; changeListener нужен useLiveQuery —
 * без него экраны не узнают, что pull записал новые строки
 */
export const openLocalDb = (userId: number): LocalDb => {
  const existing = opened.get(userId);
  if (existing) return existing;
  const sqlite = openDatabaseSync(fileOf(userId), { enableChangeListener: true });
  // WAL: чтение экранов не ждёт, пока синк пишет пачку в транзакции
  sqlite.execSync('PRAGMA journal_mode = WAL;');
  const db = drizzle(sqlite, { schema });
  opened.set(userId, db);
  return db;
};
