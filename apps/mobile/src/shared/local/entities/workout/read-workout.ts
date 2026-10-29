import { and, asc, desc, eq, inArray, lt, ne } from 'drizzle-orm';

import type {
  Cooldown,
  CooldownStretch,
  CurrentWorkout,
  Workout,
  WorkoutAnalog,
  WorkoutItem,
  WorkoutSummary,
} from '@sportbot/api/entities/workout';
import { cooldownMinutes, stretchSeconds } from '@sportbot/api/lib/cooldown';
import { workoutRecords } from '@sportbot/api/lib/records';
import { localToday } from '@sportbot/api/lib/time';
import { exerciseRests, workoutTiming } from '@sportbot/api/lib/workout-timing';

import type { LocalDb } from '@/shared/db';
import {
  complexes,
  exercises,
  muscles,
  profile,
  stretches,
  workoutExercises,
  workouts,
  workoutSets,
  workoutStretches,
} from '@/shared/db/schema';

import { byUiId, limitedZonesOf, uiIdOf } from '../../read-common';
import { exerciseLookup, orNull } from '../program/read-program';

type Reader = Pick<LocalDb, 'select'>;
export type WorkoutRow = typeof workouts.$inferSelect;
export type ItemRow = typeof workoutExercises.$inferSelect;
export type SetRow = typeof workoutSets.$inferSelect;
export type LoadedItem = ItemRow & { sets: SetRow[] };
export type LoadedWorkout = { row: WorkoutRow; items: LoadedItem[] };

export const DONE_STATUSES = ['FINISHED', 'AUTO_CLOSED'] as const;

/** Сколько аналогов предложить для замены — как на сервере */
const ANALOGS_LIMIT = 8;

/** Упражнение сделано: отмечено или есть подход — как isDone на сервере */
export const isItemDone = (item: LoadedItem) => item.done || item.sets.length > 0;

export const findWorkoutRow = (db: Reader, id: number): WorkoutRow | undefined =>
  db.select().from(workouts).where(byUiId(workouts, id)).get();

export const findItemRow = (db: Reader, id: number): ItemRow | undefined =>
  db.select().from(workoutExercises).where(byUiId(workoutExercises, id)).get();

export const findSetRow = (db: Reader, ref: { id: number; clientId?: string | null }): SetRow | undefined =>
  ref.clientId
    ? db.select().from(workoutSets).where(eq(workoutSets.clientId, ref.clientId)).get()
    : db.select().from(workoutSets).where(byUiId(workoutSets, ref.id)).get();

/** Незавершённая тренировка: она может быть только одна */
export const currentWorkoutRow = (db: Reader): WorkoutRow | undefined =>
  db.select().from(workouts).where(eq(workouts.status, 'IN_PROGRESS')).orderBy(desc(workouts.startedAt)).get();

/** Упражнения тренировки по порядку, подходы — по номеру */
export const loadWorkout = (db: Reader, row: WorkoutRow): LoadedWorkout => {
  const items = db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutClientId, row.clientId))
    .orderBy(asc(workoutExercises.position))
    .all();
  const sets = items.length
    ? db
        .select()
        .from(workoutSets)
        .where(
          inArray(
            workoutSets.workoutExerciseClientId,
            items.map((i) => i.clientId),
          ),
        )
        .orderBy(asc(workoutSets.number))
        .all()
    : [];
  return {
    row,
    items: items.map((item) => ({ ...item, sets: sets.filter((s) => s.workoutExerciseClientId === item.clientId) })),
  };
};

const timingOf = ({ row, items }: LoadedWorkout) =>
  workoutTiming({
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    cooldownStartedAt: row.cooldownStartedAt,
    cooldownFinishedAt: row.cooldownFinishedAt,
    items: items.map((item) => ({
      key: item.clientId,
      superset: item.superset,
      sets: item.sets.map((s) => ({
        key: s.clientId,
        doneAt: s.doneAt,
        workSeconds: s.workSeconds,
        restTargetSeconds: s.restTargetSeconds,
      })),
    })),
  });

/**
 * Прошлый результат: последняя засчитанная тренировка с этим упражнением и подходами —
 * как lastResult на сервере (последняя по дате)
 */
const lastResultOf = (db: Reader, exerciseIds: number[]) => {
  if (!exerciseIds.length) return () => null;
  const rows = db
    .select({ item: workoutExercises, date: workouts.date, startedAt: workouts.startedAt })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.clientId, workoutExercises.workoutClientId))
    .where(and(inArray(workoutExercises.exerciseId, exerciseIds), inArray(workouts.status, [...DONE_STATUSES])))
    .all();
  const sets = rows.length
    ? db
        .select()
        .from(workoutSets)
        .where(
          inArray(
            workoutSets.workoutExerciseClientId,
            rows.map((r) => r.item.clientId),
          ),
        )
        .orderBy(asc(workoutSets.number))
        .all()
    : [];
  const setsOf = (clientId: string) => sets.filter((s) => s.workoutExerciseClientId === clientId);
  return (exerciseId: number) => {
    const found = rows
      .filter((r) => r.item.exerciseId === exerciseId && setsOf(r.item.clientId).length)
      .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt))[0];
    if (!found) return null;
    const foundSets = setsOf(found.item.clientId);
    const rests = exerciseRests(foundSets);
    return {
      date: found.date,
      sets: foundSets.map((s, index) => ({ weight: s.weight, reps: s.reps, restBeforeSeconds: rests[index] ?? null })),
    };
  };
};

const complexIdOf = (db: Reader, clientId: string | null): number | null => {
  const row = clientId
    ? db.select({ id: complexes.id, localId: complexes.localId }).from(complexes).where(eq(complexes.clientId, clientId)).get()
    : undefined;
  return row ? uiIdOf(row) : null;
};

/** Тренировка в форме GET workout/:id — как WorkoutAppService.view */
export const workoutView = (db: Reader, loaded: LoadedWorkout): Workout | null =>
  orNull(() => {
    const settings = db.select().from(profile).get();
    if (!settings) return null;
    const { row, items } = loaded;
    const restBefore = timingOf(loaded)?.restBefore ?? new Map<string, number>();
    const lookup = exerciseLookup(
      db,
      items.map((i) => i.exerciseId),
    );
    const last = lastResultOf(
      db,
      items.map((i) => i.exerciseId),
    );
    const zones = limitedZonesOf(db, localToday(settings.timeZone));

    return {
      id: uiIdOf(row),
      complexId: complexIdOf(db, row.complexClientId),
      complexName: row.complexName,
      status: row.status,
      date: row.date,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      cardioName: row.cardioName,
      cardioMinutes: row.cardioMinutes,
      warmupMinutes: row.warmupMinutes,
      warmupFinishedAt: row.warmupFinishedAt,
      exercises: items.map((item): WorkoutItem => {
        const exercise = lookup.get(item.exerciseId);
        return {
          id: uiIdOf(item),
          exerciseId: item.exerciseId,
          name: exercise.name,
          muscles: lookup.primaryMuscles(exercise),
          imageUrl: exercise.imageUrl,
          technique: exercise.technique,
          steps: exercise.steps,
          mistakes: exercise.mistakes,
          imageEndUrl: exercise.imageEndUrl,
          imageCredit: exercise.imageCredit,
          videoUrl: exercise.videoUrl,
          bodyweight: exercise.equipment === 'BODYWEIGHT',
          measure: exercise.measure,
          draft: exercise.draft,
          done: isItemDone(item),
          replaced: item.replacedExerciseId !== null,
          plannedSets: item.plannedSets,
          repsMin: item.repsMin,
          repsMax: item.repsMax,
          superset: item.superset,
          limitedZones: zones(exercise.jointIds),
          sets: item.sets.map((s) => ({
            id: uiIdOf(s),
            number: s.number,
            weight: s.weight,
            reps: s.reps,
            clientId: s.clientId,
            doneAt: s.doneAt,
            workSeconds: s.workSeconds,
            restTargetSeconds: s.restTargetSeconds,
            restBeforeSeconds: restBefore.get(s.clientId) ?? null,
          })),
          last: last(item.exerciseId),
        };
      }),
      settings: {
        showRestTimer: settings.showRestTimer,
        restSeconds: settings.restSeconds,
        restAutoStart: settings.restAutoStart,
        timerSound: settings.timerSound,
        timerVibration: settings.timerVibration,
      },
    };
  });

export const readWorkout = (db: LocalDb, id: number): Workout | null => {
  const row = findWorkoutRow(db, id);
  return row ? workoutView(db, loadWorkout(db, row)) : null;
};

/** Идущая тренировка — как GET workout/current. Профиля ещё нет — отвечает сервер */
export const readCurrentWorkout = (db: LocalDb): CurrentWorkout | null => {
  if (!db.select({ id: profile.id }).from(profile).get()) return null;
  const row = currentWorkoutRow(db);
  if (!row) return { workout: null };
  const workout = workoutView(db, loadWorkout(db, row));
  return workout && { workout };
};

/** Итог — как WorkoutAppService.summary: цифры, серия, рекорды по истории телефона, разбивка времени */
export const readSummary = (db: LocalDb, id: number): WorkoutSummary | null =>
  orNull(() => {
    const row = findWorkoutRow(db, id);
    const settings = db.select().from(profile).get();
    if (!row || !settings) return null;
    const loaded = loadWorkout(db, row);
    const sets = loaded.items.flatMap((i) => i.sets);
    const end = row.finishedAt ? Date.parse(row.finishedAt) : Date.now();
    const lookup = exerciseLookup(
      db,
      loaded.items.map((i) => i.exerciseId),
    );
    const exerciseIds = [...new Set(loaded.items.filter((i) => i.sets.length).map((i) => i.exerciseId))];
    const history = exerciseIds.length
      ? db
          .select({ exerciseId: workoutExercises.exerciseId, clientId: workoutExercises.clientId })
          .from(workoutExercises)
          .innerJoin(workouts, eq(workouts.clientId, workoutExercises.workoutClientId))
          .where(
            and(
              inArray(workoutExercises.exerciseId, exerciseIds),
              inArray(workouts.status, [...DONE_STATUSES]),
              ne(workouts.clientId, row.clientId),
              lt(workouts.startedAt, row.startedAt),
            ),
          )
          .all()
      : [];
    const historySets = history.length
      ? db
          .select()
          .from(workoutSets)
          .where(
            inArray(
              workoutSets.workoutExerciseClientId,
              history.map((h) => h.clientId),
            ),
          )
          .all()
      : [];
    const timing = timingOf(loaded);

    return {
      workoutId: uiIdOf(row),
      complexName: row.complexName,
      status: row.status,
      minutes: Math.max(1, Math.round((end - Date.parse(row.startedAt)) / 60_000)),
      exercisesDone: loaded.items.filter(isItemDone).length,
      exercisesTotal: loaded.items.length,
      sets: sets.length,
      tonnage: Math.round(sets.reduce((sum, s) => sum + s.weight * s.reps, 0)),
      currentStreak: settings.currentStreak,
      cardioName: row.cardioName,
      cardioMinutes: row.cardioMinutes,
      records: workoutRecords(
        loaded.items.map((item) => {
          const exercise = lookup.get(item.exerciseId);
          return { exerciseId: item.exerciseId, name: exercise.name, measure: exercise.measure, sets: item.sets };
        }),
        history.map((h) => ({
          exerciseId: h.exerciseId,
          sets: historySets.filter((s) => s.workoutExerciseClientId === h.clientId),
        })),
      ),
      timing: timing && {
        warmupSeconds: timing.warmupSeconds,
        workSeconds: timing.workSeconds,
        restSeconds: timing.restSeconds,
        restCount: timing.restCount,
        restTargetSeconds: timing.restTargetSeconds,
        restPlannedActualSeconds: timing.restPlannedActualSeconds,
        tailSeconds: timing.tailSeconds,
        cooldownSeconds: timing.cooldownSeconds,
      },
    };
  });

/** Растяжка заминки в форме ответа: мышцы — все, через « · » */
export const stretchView = (db: Reader, ids: number[]) => {
  const rows = new Map(
    (ids.length ? db.select().from(stretches).where(inArray(stretches.id, ids)).all() : []).map((s) => [s.id, s]),
  );
  const muscleNames = new Map(db.select().from(muscles).all().map((m) => [m.id, m.name]));
  return (id: number): CooldownStretch | null => {
    const s = rows.get(id);
    if (!s) return null;
    return {
      id: s.id,
      name: s.name,
      howTo: s.howTo,
      steps: s.steps,
      mistakes: s.mistakes,
      imageUrl: s.imageUrl,
      imageEndUrl: s.imageEndUrl,
      feel: s.feel,
      videoUrl: s.videoUrl,
      imageCredit: s.imageCredit,
      holdSeconds: s.holdSeconds,
      perSide: s.perSide,
      muscles: s.muscleIds
        .map((m) => muscleNames.get(m))
        .filter(Boolean)
        .join(' · '),
    };
  };
};

/** Сохранённая заминка — как WorkoutAppService.cooldownView. null — набора ещё нет */
export const readSavedCooldown = (db: Reader, row: WorkoutRow): Cooldown | null => {
  const settings = db.select().from(profile).get();
  const saved = db
    .select()
    .from(workoutStretches)
    .where(eq(workoutStretches.workoutClientId, row.clientId))
    .orderBy(asc(workoutStretches.position))
    .all();
  if (!saved.length || !settings) return null;
  const view = stretchView(
    db,
    saved.map((s) => s.stretchId),
  );
  const block = (name: 'MAIN' | 'OPTIONAL') =>
    saved
      .filter((s) => s.block === name)
      .map((s) => view(s.stretchId))
      .filter((s): s is CooldownStretch => !!s);
  const main = block('MAIN');
  const optional = block('OPTIONAL');
  return {
    workoutId: uiIdOf(row),
    minutes: cooldownMinutes([...main, ...optional]),
    optionalMinutes: Math.ceil(optional.reduce((sum, s) => sum + stretchSeconds(s), 0) / 60),
    timerSound: settings.timerSound,
    timerVibration: settings.timerVibration,
    main,
    optional,
  };
};

/**
 * Аналоги для замены — как WorkoutService.analogs: общая основная мышца, без стоящих в тренировке
 * и без нагружающих зоны с ограничением; больше общих мышц — выше, дальше по алфавиту
 */
export const readAnalogs = (db: LocalDb, itemId: number): WorkoutAnalog[] | null =>
  orNull(() => {
    const item = findItemRow(db, itemId);
    const settings = db.select().from(profile).get();
    if (!item || !settings) return null;
    const lookup = exerciseLookup(db, [item.exerciseId]);
    const primaryIds = lookup
      .get(item.exerciseId)
      .muscles.filter((m) => m.role === 'PRIMARY')
      .map((m) => m.muscleId);
    const inWorkout = new Set(
      db
        .select({ exerciseId: workoutExercises.exerciseId })
        .from(workoutExercises)
        .where(eq(workoutExercises.workoutClientId, item.workoutClientId))
        .all()
        .map((e) => e.exerciseId),
    );
    const limitedOf = limitedZonesOf(db, localToday(settings.timeZone));
    const matched = (e: typeof exercises.$inferSelect) =>
      e.muscles.filter((m) => m.role === 'PRIMARY' && primaryIds.includes(m.muscleId)).length;
    const candidates = db
      .select()
      .from(exercises)
      .all()
      .filter((e) => !inWorkout.has(e.id) && matched(e) > 0 && !limitedOf(e.jointIds).length);
    const names = exerciseLookup(
      db,
      candidates.map((c) => c.id),
    );
    return candidates
      .sort((a, b) => matched(b) - matched(a) || a.name.localeCompare(b.name, 'ru'))
      .slice(0, ANALOGS_LIMIT)
      .map((e) => ({
        id: e.id,
        name: e.name,
        muscles: names.primaryMuscles(e),
        imageUrl: e.imageUrl,
        draft: e.draft,
      }));
  });
