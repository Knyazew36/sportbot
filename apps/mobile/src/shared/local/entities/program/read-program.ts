import { asc, eq, inArray } from 'drizzle-orm';

import type { Program, ProgramComplex, ProgramListItem } from '@sportbot/api/entities/program';
import { nextInQueue } from '@sportbot/api/lib/day';

import type { LocalDb } from '@/shared/db';

import { byUiId, uiIdOf } from '../../read-common';
import { complexes, complexExercises, exercises, muscles, profile, programs } from '@/shared/db/schema';

type ComplexRow = typeof complexes.$inferSelect;
type ItemRow = typeof complexExercises.$inferSelect;
type ExerciseRow = typeof exercises.$inferSelect;

/** Строка ещё без серверного id или упражнения нет в справочнике — собрать ответ нельзя, отвечает сервер */
class Incomplete extends Error {}

/** Комплексы программы по очереди с упражнениями по порядку */
export const complexesOf = (db: LocalDb, programClientId: string): (ComplexRow & { items: ItemRow[] })[] => {
  const rows = db
    .select()
    .from(complexes)
    .where(eq(complexes.programClientId, programClientId))
    .orderBy(asc(complexes.position))
    .all();
  const items = rows.length
    ? db
        .select()
        .from(complexExercises)
        .where(
          inArray(
            complexExercises.complexClientId,
            rows.map((c) => c.clientId),
          ),
        )
        .orderBy(asc(complexExercises.position))
        .all()
    : [];
  return rows.map((c) => ({ ...c, items: items.filter((i) => i.complexClientId === c.clientId) }));
};

/** Упражнения справочника по id и названия мышц — подписи строк программы и «Сегодня» */
export const exerciseLookup = (db: Pick<LocalDb, 'select'>, ids: number[]) => {
  const byId = new Map<number, ExerciseRow>(
    (ids.length ? db.select().from(exercises).where(inArray(exercises.id, ids)).all() : []).map((e) => [e.id, e]),
  );
  const muscleNames = new Map(db.select().from(muscles).all().map((m) => [m.id, m.name]));
  return {
    get: (id: number): ExerciseRow => {
      const exercise = byId.get(id);
      if (!exercise) throw new Incomplete();
      return exercise;
    },
    /** Основные мышцы через « · », как на сервере */
    primaryMuscles: (exercise: ExerciseRow) =>
      exercise.muscles
        .filter((m) => m.role === 'PRIMARY')
        .map((m) => muscleNames.get(m.muscleId))
        .filter(Boolean)
        .join(' · '),
  };
};

/** Указатель очереди активной программы с починкой, как nextComplex на сервере */
export const nextComplexOf = <C extends Pick<ComplexRow, 'clientId'>>(
  ordered: C[],
  pointer: string | null | undefined,
): C | null => {
  const clientId = nextInQueue(
    pointer ?? null,
    ordered.map((c) => c.clientId),
  );
  return ordered.find((c) => c.clientId === clientId) ?? null;
};

/** Собрать ответ; Incomplete — в null, чтобы ответил сервер */
export const orNull = <T>(build: () => T): T | null => {
  try {
    return build();
  } catch (error) {
    if (error instanceof Incomplete) return null;
    throw error;
  }
};

const readProfilePointers = (db: LocalDb) =>
  db
    .select({ active: profile.activeProgramClientId, next: profile.nextComplexClientId })
    .from(profile)
    .get();

/** Свои программы — как GET program/list */
export const readPrograms = (db: LocalDb): ProgramListItem[] | null =>
  orNull(() => {
    const pointers = readProfilePointers(db);
    if (!pointers) return null;
    const rows = db.select().from(programs).all();
    const counts = new Map<string, number>();
    for (const c of db.select({ program: complexes.programClientId }).from(complexes).all())
      counts.set(c.program, (counts.get(c.program) ?? 0) + 1);
    return rows
      .map((p) => ({
        id: uiIdOf(p),
        name: p.name,
        complexCount: counts.get(p.clientId) ?? 0,
        active: p.clientId === pointers.active,
        fromFriend: p.fromFriend,
        fromTemplate: p.fromTemplate,
        sourceUpdated: p.sourceUpdated,
      }))
      .sort((a, b) => (a.id < 0 ? Infinity : a.id) - (b.id < 0 ? Infinity : b.id) || b.id - a.id);
  });

/** Своя программа целиком — как GET program/:id (ProgramAppService.view) */
export const readProgram = (db: LocalDb, id: number): Program | null =>
  orNull(() => {
    const pointers = readProfilePointers(db);
    const p = db.select().from(programs).where(byUiId(programs, id)).get();
    if (!pointers || !p) return null;
    const active = p.clientId === pointers.active;
    const rows = complexesOf(db, p.clientId);
    const next = active ? nextComplexOf(rows, pointers.next) : null;
    const lookup = exerciseLookup(
      db,
      rows.flatMap((c) => c.items.map((i) => i.exerciseId)),
    );

    return {
      id: uiIdOf(p),
      name: p.name,
      description: p.description,
      active,
      fromFriend: p.fromFriend,
      fromTemplate: p.fromTemplate,
      sourceUpdated: p.sourceUpdated,
      isPublished: p.isPublished,
      takenProgramId: null,
      tags: p.tags,
      complexes: rows.map(
        (c): ProgramComplex => ({
          id: uiIdOf(c),
          name: c.name,
          position: c.position,
          cardioName: c.cardioName,
          cardioMinutes: c.cardioMinutes,
          warmupMinutes: c.warmupMinutes,
          isNext: c.clientId === next?.clientId,
          exercises: c.items.map((item) => {
            const exercise = lookup.get(item.exerciseId);
            return {
              id: uiIdOf(item),
              exerciseId: item.exerciseId,
              name: exercise.name,
              muscles: lookup.primaryMuscles(exercise),
              draft: exercise.draft,
              sets: item.sets,
              repsMin: item.repsMin,
              repsMax: item.repsMax,
              measure: exercise.measure,
              superset: item.superset,
            };
          }),
        }),
      ),
      addedCount: p.addedCount,
      author: null,
      mine: false,
      publication: p.publication,
      textPending: p.textPending,
      rejectReason: p.rejectReason,
    };
  });
