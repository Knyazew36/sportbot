import { notInArray } from 'drizzle-orm';

import type { SyncCatalogResponseDto } from '@sportbot/api/generated/model';

import type { LocalDb } from '@/shared/db/client';
import { META_KEYS, writeMeta } from '@/shared/db/meta';
import * as t from '@/shared/db/schema';
import { upsertRows } from '@/shared/db/upsert';

/**
 * Справочник — одной транзакцией. Мышцы, суставы и теги приходят целиком и заменяются;
 * упражнения и растяжки — изменённые с курсора, а списки id говорят, какие из них ещё видны
 */
export const applyCatalog = (db: LocalDb, res: SyncCatalogResponseDto) =>
  db.transaction((tx) => {
    tx.delete(t.muscles).run();
    tx.delete(t.joints).run();
    tx.delete(t.tagGroups).run();
    tx.delete(t.tags).run();
    upsertRows(tx, t.muscles, t.muscles.id, res.muscles);
    upsertRows(tx, t.joints, t.joints.id, res.joints);
    upsertRows(tx, t.tagGroups, t.tagGroups.id, res.tagGroups);
    upsertRows(tx, t.tags, t.tags.id, res.tags);

    upsertRows(tx, t.exercises, t.exercises.id, res.exercises);
    upsertRows(tx, t.stretches, t.stretches.id, res.stretches);
    // Снятые черновики и слитые дубли: их больше нет среди видимых
    tx.delete(t.exercises).where(notInArray(t.exercises.id, res.exerciseIds)).run();
    tx.delete(t.stretches).where(notInArray(t.stretches.id, res.stretchIds)).run();

    writeMeta(tx, META_KEYS.catalogCursor, res.cursor);
  });
