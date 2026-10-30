import { asc, eq } from 'drizzle-orm';

import type { StretchRoutine } from '@sportbot/api/entities/stretch-routine';
import type { CooldownStretch } from '@sportbot/api/entities/workout';
import { cooldownMinutes } from '@sportbot/api/lib/cooldown';

import { stretchRoutines } from '@/shared/db/schema';

import { stretchView } from '../workout/read-workout';

type Reader = Parameters<typeof stretchView>[0];
type RoutineRow = typeof stretchRoutines.$inferSelect;

/** Форма ответа сервера: экранам всё равно, откуда комплекс */
const toRoutine = (db: Reader, row: RoutineRow): StretchRoutine => {
  const view = stretchView(db, row.stretchIds);
  const stretches = row.stretchIds.map(view).filter((s): s is CooldownStretch => !!s);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    published: true,
    minutes: cooldownMinutes(stretches),
    stretches,
  };
};

/** Пусто — первый синк ещё не привёз комплексы: null уводит запрос на сервер */
export const readStretchRoutines = (db: Reader): StretchRoutine[] | null => {
  const rows = db.select().from(stretchRoutines).orderBy(asc(stretchRoutines.position), asc(stretchRoutines.id)).all();
  return rows.length ? rows.map((row) => toRoutine(db, row)) : null;
};

export const readStretchRoutine = (db: Reader, id: number): StretchRoutine | null => {
  const row = db.select().from(stretchRoutines).where(eq(stretchRoutines.id, id)).get();
  return row ? toRoutine(db, row) : null;
};
