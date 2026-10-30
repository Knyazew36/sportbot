import { eq } from 'drizzle-orm';

import { newClientId } from '@sportbot/api/entities/workout';
import { localToday } from '@sportbot/api/lib/time';

import type { LocalDb } from '@/shared/db';
import { profile, stretchRoutines, stretchSessions } from '@/shared/db/schema';
import { enqueue } from '@/shared/sync/outbox';

/** Начать занятие: сеть не нужна, на сервер уйдёт очередью. Ответ — clientId для конца занятия */
export const startStretchSession = (db: LocalDb, routineId: number): string =>
  db.transaction((tx) => {
    const routine = tx.select().from(stretchRoutines).where(eq(stretchRoutines.id, routineId)).get();
    if (!routine) throw new Error('Комплекс не найден.');
    const settings = tx.select({ timeZone: profile.timeZone }).from(profile).get();
    const clientId = newClientId();
    const startedAt = new Date().toISOString();
    const row = {
      routineId,
      routineName: routine.name,
      date: localToday(settings?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone),
      startedAt,
    };
    tx.insert(stretchSessions)
      .values({ clientId, ...row, updatedAt: startedAt })
      .run();
    enqueue(tx, { type: 'stretchSession.start', entity: 'StretchSession', clientId, payload: row });
    return clientId;
  });

export const finishStretchSession = (db: LocalDb, clientId: string): void =>
  db.transaction((tx) => {
    const finishedAt = new Date().toISOString();
    tx.update(stretchSessions)
      .set({ finishedAt, updatedAt: finishedAt })
      .where(eq(stretchSessions.clientId, clientId))
      .run();
    enqueue(tx, { type: 'stretchSession.finish', entity: 'StretchSession', clientId, payload: { finishedAt } });
  });
