import { eq } from 'drizzle-orm';

import type { LocalDb } from './client';
import { meta } from './schema';

export const META_KEYS = {
  /** Курсор GET sync/pull */
  cursor: 'cursor',
  /** Курсор GET sync/catalog */
  catalogCursor: 'catalogCursor',
  /** Последний обмен с сервером, ISO */
  syncedAt: 'syncedAt',
  /** Картинки справочника скачаны для офлайна, ISO */
  mediaAt: 'mediaAt',
  /** Набор картинок активной программы, скачанный последним, — url через пробел */
  programMedia: 'programMedia',
  /** Последний выданный localId (отрицательный) */
  localSeq: 'localSeq',
  /** Отклонённые сервером правки, JSON SyncIssue[] — плашка в «Я → Офлайн» */
  issues: 'issues',
} as const;

export type MetaKey = (typeof META_KEYS)[keyof typeof META_KEYS];

type MetaWriter = Pick<LocalDb, 'insert'>;

export const readMeta = (db: Pick<LocalDb, 'select'>, key: MetaKey): string | undefined =>
  db.select({ value: meta.value }).from(meta).where(eq(meta.key, key)).get()?.value;

export const writeMeta = (db: MetaWriter, key: MetaKey, value: string) =>
  db.insert(meta).values({ key, value }).onConflictDoUpdate({ target: meta.key, set: { value } }).run();
