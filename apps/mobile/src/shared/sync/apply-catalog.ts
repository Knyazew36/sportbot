import { notInArray } from 'drizzle-orm';

import type { SyncCatalogResponseDto } from '@sportbot/api/generated/model';

import type { LocalDb } from '@/shared/db/client';
import { META_KEYS, readMeta, writeMeta } from '@/shared/db/meta';
import * as t from '@/shared/db/schema';
import { upsertRows } from '@/shared/db/upsert';

import { contentHash } from './content-hash';

/**
 * Справочник — одной транзакцией. Мышцы, суставы, теги и шаблоны приходят целиком и заменяются, только если
 * поменялись; упражнения и растяжки — изменённые с курсора, а списки id говорят, какие из них ещё видны
 */
export const applyCatalog = (db: LocalDb, res: SyncCatalogResponseDto, cursor: string | null = res.cursor) =>
  db.transaction((tx) => {
    // В снимке из старой сборки комплексов нет: заполнятся первым синком
    const routines = res.stretchRoutines ?? [];
    const refsHash = contentHash([res.muscles, res.joints, res.tagGroups, res.tags, res.templates, routines]);
    // Отпечаток совпал, а мышц нет — таблицу очистили мимо синка: без проверки она так и осталась бы пустой
    const hasMuscles = !!tx.select({ id: t.muscles.id }).from(t.muscles).get();
    if (readMeta(tx, META_KEYS.catalogRefsHash) !== refsHash || !hasMuscles) {
      tx.delete(t.muscles).run();
      tx.delete(t.joints).run();
      tx.delete(t.tagGroups).run();
      tx.delete(t.tags).run();
      tx.delete(t.templates).run();
      tx.delete(t.stretchRoutines).run();
      upsertRows(tx, t.muscles, t.muscles.id, res.muscles);
      upsertRows(tx, t.joints, t.joints.id, res.joints);
      upsertRows(tx, t.tagGroups, t.tagGroups.id, res.tagGroups);
      upsertRows(tx, t.tags, t.tags.id, res.tags);
      upsertRows(tx, t.templates, t.templates.id, res.templates);
      upsertRows(tx, t.stretchRoutines, t.stretchRoutines.id, routines);
      writeMeta(tx, META_KEYS.catalogRefsHash, refsHash);
    }

    upsertRows(tx, t.exercises, t.exercises.id, res.exercises);
    upsertRows(tx, t.stretches, t.stretches.id, res.stretches);
    // Снятые черновики и слитые дубли: их больше нет среди видимых. Нечего удалять — DELETE событий не шлёт
    tx.delete(t.exercises).where(notInArray(t.exercises.id, res.exerciseIds)).run();
    tx.delete(t.stretches).where(notInArray(t.stretches.id, res.stretchIds)).run();

    // Снимок из сборки курсора не ставит: первый синк возьмёт справочник целиком, вместе со своими черновиками
    if (cursor) writeMeta(tx, META_KEYS.catalogCursor, cursor);
  });
