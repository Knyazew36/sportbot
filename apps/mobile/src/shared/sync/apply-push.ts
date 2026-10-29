import { and, asc, eq, inArray, isNull } from 'drizzle-orm';

import type { SyncOpResultDto } from '@sportbot/api/generated/model';

import type { LocalDb } from '@/shared/db/client';
import { META_KEYS, readMeta, writeMeta } from '@/shared/db/meta';
import * as t from '@/shared/db/schema';

import { PUSH_BATCH, SYNC_ISSUES_KEEP } from './constants';

export type OutboxRow = typeof t.outbox.$inferSelect;

/** Правка, которую сервер не принял: показывается в «Я → Офлайн» */
export type SyncIssue = { at: string; type: string; reason: string };

// Таблицы, строки которых создаются на телефоне и получают серверный id из ответа push
const WITH_SERVER_ID = [
  t.workouts,
  t.workoutExercises,
  t.workoutSets,
  t.workoutStretches,
  t.planDays,
  t.pauses,
  t.limitations,
  t.bodyWeights,
] as const;

export const nextBatch = (db: LocalDb): OutboxRow[] =>
  db.select().from(t.outbox).orderBy(asc(t.outbox.seq)).limit(PUSH_BATCH).all();

export const readIssues = (db: Pick<LocalDb, 'select'>): SyncIssue[] => {
  try {
    return JSON.parse(readMeta(db, META_KEYS.issues) ?? '[]') as SyncIssue[];
  } catch {
    return [];
  }
};

/**
 * Ответ push — в базу одной транзакцией: серверные id созданным строкам, снятые операции — из очереди.
 * Отказ (rejected) откатывать по месту не пытаемся: сбрасываем курсор, и следующий pull — полный
 * снимок, который вернёт телефон к серверной правде, не трогая ещё не отправленное
 */
export const applyPush = (db: LocalDb, sent: OutboxRow[], results: SyncOpResultDto[]) =>
  db.transaction((tx) => {
    const byOpId = new Map(sent.map((op) => [op.opId, op]));
    const issues: SyncIssue[] = [];
    for (const result of results) {
      const op = byOpId.get(result.opId);
      if (!op) continue;
      for (const [clientId, id] of Object.entries(result.ids ?? {}))
        // Только строкам без id: повторный ответ на ту же операцию не будит экраны
        for (const table of WITH_SERVER_ID)
          tx.update(table).set({ id }).where(and(eq(table.clientId, clientId), isNull(table.id))).run();
      // Сервер успел собрать свою заминку: наша лишняя, pull привезёт серверную
      if (result.status === 'skipped' && op.type === 'cooldown.build')
        tx.delete(t.workoutStretches).where(eq(t.workoutStretches.workoutClientId, op.clientId)).run();
      // День или вес за день уже были на сервере со своим clientId (день завёл крон, вес записан в боте):
      // наша копия без серверного id лишняя, pull привезёт серверную
      if (op.entity === 'PlanDay')
        tx.delete(t.planDays).where(and(eq(t.planDays.clientId, op.clientId), isNull(t.planDays.id))).run();
      if (op.entity === 'BodyWeight')
        tx.delete(t.bodyWeights).where(and(eq(t.bodyWeights.clientId, op.clientId), isNull(t.bodyWeights.id))).run();
      if (result.status === 'rejected')
        issues.push({ at: op.at, type: op.type, reason: result.reason ?? 'Сервер не принял изменение' });
    }
    tx.delete(t.outbox)
      .where(
        inArray(
          t.outbox.opId,
          results.map((r) => r.opId),
        ),
      )
      .run();
    if (issues.length) {
      writeMeta(tx, META_KEYS.issues, JSON.stringify([...issues, ...readIssues(tx)].slice(0, SYNC_ISSUES_KEEP)));
      tx.delete(t.meta).where(eq(t.meta.key, META_KEYS.cursor)).run();
    }
    return issues.length;
  });

export const clearIssues = (db: LocalDb) => db.delete(t.meta).where(eq(t.meta.key, META_KEYS.issues)).run();
