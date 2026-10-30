import { and, eq, inArray, isNotNull, isNull, notInArray } from 'drizzle-orm';

import type { SyncPullResponseDto } from '@sportbot/api/generated/model';

import type { LocalDb } from '@/shared/db/client';
import { META_KEYS, readMeta, writeMeta } from '@/shared/db/meta';
import * as t from '@/shared/db/schema';
import { upsertRows } from '@/shared/db/upsert';

import { contentHash } from './content-hash';

type Tx = Parameters<Parameters<LocalDb['transaction']>[0]>[0];

// Таблицы с clientId — порядок родитель → ребёнок
const OWN_TABLES = [
  t.programs,
  t.complexes,
  t.complexExercises,
  t.planDays,
  t.workouts,
  t.workoutExercises,
  t.workoutSets,
  t.workoutStretches,
  t.pauses,
  t.limitations,
  t.stretchExclusions,
  t.stretchSessions,
  t.bodyWeights,
] as const;

// Таблицы, где у строк, созданных на телефоне, есть id экрана localId
const WITH_LOCAL_ID = [
  t.programs,
  t.complexes,
  t.complexExercises,
  t.planDays,
  t.workouts,
  t.workoutExercises,
  t.workoutSets,
  t.workoutStretches,
  t.pauses,
  t.limitations,
] as const;

const pendingOf = (tx: Tx) =>
  new Set(
    tx
      .select({ clientId: t.outbox.clientId, touched: t.outbox.touched })
      .from(t.outbox)
      .all()
      .flatMap((r) => [r.clientId, ...r.touched]),
  );

/**
 * Каскад надгробий: сервер пишет надгробие только удалённой строке, не её детям (триггер ловит
 * DELETE родителя, каскад Postgres надгробий не порождает) — детей удаляем сами
 */
const removeByEntity = (tx: Tx, entity: string, ids: string[]) => {
  if (!ids.length) return;
  switch (entity) {
    case 'Program': {
      const complexIds = tx
        .select({ clientId: t.complexes.clientId })
        .from(t.complexes)
        .where(inArray(t.complexes.programClientId, ids))
        .all()
        .map((c) => c.clientId);
      removeByEntity(tx, 'Complex', complexIds);
      tx.delete(t.programs).where(inArray(t.programs.clientId, ids)).run();
      return;
    }
    case 'StretchSession':
      tx.delete(t.stretchSessions).where(inArray(t.stretchSessions.clientId, ids)).run();
      return;
    case 'Complex':
      tx.delete(t.complexExercises).where(inArray(t.complexExercises.complexClientId, ids)).run();
      tx.delete(t.complexes).where(inArray(t.complexes.clientId, ids)).run();
      return;
    case 'Workout': {
      const itemIds = tx
        .select({ clientId: t.workoutExercises.clientId })
        .from(t.workoutExercises)
        .where(inArray(t.workoutExercises.workoutClientId, ids))
        .all()
        .map((e) => e.clientId);
      removeByEntity(tx, 'WorkoutExercise', itemIds);
      tx.delete(t.workoutStretches).where(inArray(t.workoutStretches.workoutClientId, ids)).run();
      tx.delete(t.workouts).where(inArray(t.workouts.clientId, ids)).run();
      return;
    }
    case 'WorkoutExercise':
      tx.delete(t.workoutSets).where(inArray(t.workoutSets.workoutExerciseClientId, ids)).run();
      tx.delete(t.workoutExercises).where(inArray(t.workoutExercises.clientId, ids)).run();
      return;
    case 'ComplexExercise':
      tx.delete(t.complexExercises).where(inArray(t.complexExercises.clientId, ids)).run();
      return;
    case 'PlanDay':
      tx.delete(t.planDays).where(inArray(t.planDays.clientId, ids)).run();
      return;
    case 'WorkoutSet':
      tx.delete(t.workoutSets).where(inArray(t.workoutSets.clientId, ids)).run();
      return;
    case 'WorkoutStretch':
      tx.delete(t.workoutStretches).where(inArray(t.workoutStretches.clientId, ids)).run();
      return;
    case 'Pause':
      tx.delete(t.pauses).where(inArray(t.pauses.clientId, ids)).run();
      return;
    case 'Limitation':
      tx.delete(t.limitations).where(inArray(t.limitations.clientId, ids)).run();
      return;
    case 'StretchExclusion':
      tx.delete(t.stretchExclusions).where(inArray(t.stretchExclusions.clientId, ids)).run();
      return;
    case 'BodyWeight':
      tx.delete(t.bodyWeights).where(inArray(t.bodyWeights.clientId, ids)).run();
      return;
    default:
      // Новая сущность на сервере, которой нет в схеме этой версии приложения
      if (__DEV__) console.warn(`[sync] надгробие неизвестной сущности ${entity}`);
  }
};

/**
 * Ответ pull — в базу одной транзакцией: экраны увидят либо старое состояние, либо новое целиком.
 * Строки с неотправленными операциями не трогаем — иначе pull откатил бы правку, сделанную офлайн
 */
export const applyPull = (db: LocalDb, res: SyncPullResponseDto, syncedAt: string) =>
  db.transaction((tx) => {
    const pending = pendingOf(tx);
    const fresh = <R extends { clientId: string }>(rows: R[]) => rows.filter((r) => !pending.has(r.clientId));

    // Снимок пересоздаёт строки, а localId сервер не знает: без возврата id экрана сменился бы на серверный
    // и открытый маршрут, ключи таймеров по id потеряли бы свою строку
    let localIds: { table: (typeof WITH_LOCAL_ID)[number]; rows: { clientId: string; localId: number | null }[] }[] = [];
    if (res.full) {
      localIds = WITH_LOCAL_ID.map((table) => ({
        table,
        rows: tx
          .select({ clientId: table.clientId, localId: table.localId })
          .from(table)
          .where(isNotNull(table.localId))
          .all(),
      }));
      // Снимок: чего нет в ответе, того нет и на сервере — кроме созданного офлайн и ещё не отправленного
      const keep = [...pending];
      for (const table of OWN_TABLES) tx.delete(table).where(notInArray(table.clientId, keep)).run();
    } else {
      const byEntity = new Map<string, string[]>();
      for (const row of res.deleted) {
        if (pending.has(row.clientId)) continue;
        byEntity.set(row.entity, [...(byEntity.get(row.entity) ?? []), row.clientId]);
      }
      for (const [entity, ids] of byEntity) removeByEntity(tx, entity, ids);
    }

    // Профиль приходит в каждом pull. Тот же, что в прошлый раз, — строка в базе уже такая (или с правкой
    // телефона, которую сервер ещё не вернул). Полный снимок пишет всегда: он и чинит расхождения
    if (res.profile) {
      const profileHash = contentHash(res.profile);
      if (res.full || readMeta(tx, META_KEYS.profileHash) !== profileHash) {
        upsertRows(tx, t.profile, t.profile.id, [{ ...res.profile, id: 1 }]);
        writeMeta(tx, META_KEYS.profileHash, profileHash);
      }
    }
    upsertRows(tx, t.programs, t.programs.clientId, fresh(res.programs));
    upsertRows(tx, t.complexes, t.complexes.clientId, fresh(res.complexes));
    upsertRows(tx, t.complexExercises, t.complexExercises.clientId, fresh(res.complexExercises));
    upsertRows(tx, t.planDays, t.planDays.clientId, fresh(res.planDays));
    upsertRows(tx, t.workouts, t.workouts.clientId, fresh(res.workouts));
    upsertRows(tx, t.workoutExercises, t.workoutExercises.clientId, fresh(res.workoutExercises));
    upsertRows(tx, t.workoutSets, t.workoutSets.clientId, fresh(res.workoutSets));
    upsertRows(tx, t.workoutStretches, t.workoutStretches.clientId, fresh(res.workoutStretches));
    upsertRows(tx, t.pauses, t.pauses.clientId, fresh(res.pauses));
    upsertRows(tx, t.limitations, t.limitations.clientId, fresh(res.limitations));
    upsertRows(tx, t.stretchExclusions, t.stretchExclusions.clientId, fresh(res.stretchExclusions));
    upsertRows(tx, t.stretchSessions, t.stretchSessions.clientId, fresh(res.stretchSessions));
    upsertRows(tx, t.bodyWeights, t.bodyWeights.clientId, fresh(res.bodyWeights));

    for (const { table, rows } of localIds)
      for (const row of rows)
        tx.update(table)
          .set({ localId: row.localId })
          .where(and(eq(table.clientId, row.clientId), isNull(table.localId)))
          .run();

    writeMeta(tx, META_KEYS.cursor, res.cursor);
    writeMeta(tx, META_KEYS.syncedAt, syncedAt);
  });
