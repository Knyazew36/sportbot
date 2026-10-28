import { getTableColumns, sql, type SQL } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable, SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core';

import type { LocalDb } from './client';

// Строк на один INSERT: у самой широкой таблицы (профиль) 26 колонок, лимит переменных SQLite — 32766
const CHUNK = 200;

type Writer = Pick<LocalDb, 'insert'>;

/** Вставить или заменить строки целиком по первичному ключу — повторно пришедшая строка pull безвредна */
export const upsertRows = <T extends SQLiteTable>(
  db: Writer,
  table: T,
  target: SQLiteColumn,
  rows: T['$inferInsert'][],
) => {
  if (!rows.length) return;
  // Колонки, пришедшие в строке, кроме ключа. Чего в строке нет (localId телефона), то не трогаем.
  // Ключи собраны в рантайме, тип drizzle их не выводит
  const present = new Set(Object.keys(rows[0]!));
  const set = Object.fromEntries(
    Object.entries(getTableColumns(table))
      .filter(([key, column]) => column.name !== target.name && present.has(key))
      .map(([key, column]): [string, SQL] => [key, sql.raw(`excluded.\`${column.name}\``)]),
  ) as SQLiteUpdateSetSource<T>;
  for (let i = 0; i < rows.length; i += CHUNK) {
    db.insert(table)
      .values(rows.slice(i, i + CHUNK))
      .onConflictDoUpdate({ target, set })
      .run();
  }
};
