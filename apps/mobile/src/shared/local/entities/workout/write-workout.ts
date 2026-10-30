import { and, asc, desc, eq, gt, inArray, ne, notInArray, sql } from 'drizzle-orm';

import type { AddSetVars, DeleteSetVars, FinishVars, UpdateSetVars } from '@sportbot/api/entities/workout';
import { newClientId } from '@sportbot/api/entities/workout';
import {
  additionFor,
  buildCooldown,
  RECENT_COOLDOWNS,
  recentPenalties,
  replacementFor,
  type CooldownCandidate,
} from '@sportbot/api/lib/cooldown';
import { advanceQueue, nextInQueue, resolveWarmup, streakOf } from '@sportbot/api/lib/day';
import { defaultPlan, isTimed, isValidSet, setError } from '@sportbot/api/lib/measure';
import { addDays, localToday } from '@sportbot/api/lib/time';

import type { LocalDb } from '@/shared/db';
import {
  complexes,
  complexExercises,
  exercises,
  muscles,
  planDays,
  profile,
  programs,
  stretches,
  stretchExclusions,
  stretchRoutines,
  workoutExercises,
  workouts,
  workoutSets,
  workoutStretches,
} from '@/shared/db/schema';
import { enqueue, type LocalTx, nextLocalId } from '@/shared/sync/outbox';

import { byUiId, uiIdOf } from '../../read-common';
import {
  currentWorkoutRow,
  findItemRow,
  findSetRow,
  findWorkoutRow,
  isItemDone,
  loadWorkout,
  type WorkoutRow,
} from './read-workout';

// Правки тренировки на телефоне: строки базы и операция для сервера — одной транзакцией.
// Проверки — те же, что делает сервер: отказ здесь лучше отказа через час в очереди

const now = () => new Date().toISOString();

export const profileOf = (tx: LocalTx) => {
  const row = tx.select().from(profile).get();
  if (!row) throw new Error('Данные ещё не загружены — подключитесь к интернету');
  return row;
};

const mustWorkout = (tx: LocalTx, id: number) => {
  const row = findWorkoutRow(tx, id);
  if (!row) throw new Error('Тренировка не найдена.');
  return row;
};

const mustItem = (tx: LocalTx, id: number) => {
  const item = findItemRow(tx, id);
  if (!item) throw new Error('Упражнение тренировки не найдено.');
  const workout = tx.select().from(workouts).where(eq(workouts.clientId, item.workoutClientId)).get();
  if (!workout) throw new Error('Тренировка не найдена.');
  return { item, workout };
};

/** id экрана тренировки по её clientId — ответ правки подхода, чтобы экран обновился сразу */
const workoutIdOf = (tx: LocalTx, clientId: string) =>
  uiIdOf(tx.select({ id: workouts.id, localId: workouts.localId }).from(workouts).where(eq(workouts.clientId, clientId)).get()!);

const measureOf = (tx: LocalTx, exerciseId: number) => {
  const exercise = tx.select({ measure: exercises.measure }).from(exercises).where(eq(exercises.id, exerciseId)).get();
  if (!exercise) throw new Error('Упражнение не найдено.');
  return exercise.measure;
};

/** Время с телефона: не раньше from и не из будущего */
const clampAt = (at: string | undefined | null, from: string) =>
  new Date(Math.min(Date.now(), Math.max(Date.parse(from), at ? Date.parse(at) : Date.now()))).toISOString();

// ── Старт ───────────────────────────────────────────────────────────────────

/**
 * Начать тренировку: выбранный комплекс или комплекс дня. Начатая уже есть — вернётся она,
 * как на сервере. Состав переносится из комплекса, id упражнений создаёт телефон
 */
type ComplexRow = typeof complexes.$inferSelect;
type ItemRow = typeof workoutExercises.$inferInsert;

/** Строки новой тренировки по комплексу: план упражнений — копия комплекса */
const insertWorkout = (
  tx: LocalTx,
  complex: ComplexRow,
  vars: { date: string; startedAt: string; warmupMinutes: number | null },
) => {
  const plan = tx
    .select()
    .from(complexExercises)
    .where(eq(complexExercises.complexClientId, complex.clientId))
    .orderBy(asc(complexExercises.position))
    .all();
  // Детальную без упражнений вести нечем
  if (!plan.length) throw new Error('В тренировке нет упражнений — добавь их в программе.');
  const row = {
    clientId: newClientId(),
    localId: nextLocalId(tx),
    complexClientId: complex.clientId,
    complexName: complex.name,
    cardioName: complex.cardioName,
    cardioMinutes: complex.cardioMinutes,
    date: vars.date,
    mode: 'DETAILED' as const,
    status: 'IN_PROGRESS' as const,
    unplanned: false,
    startedAt: vars.startedAt,
    warmupMinutes: vars.warmupMinutes,
    updatedAt: vars.startedAt,
  };
  tx.insert(workouts).values(row).run();
  const items = plan.map((p) => ({
    clientId: newClientId(),
    localId: nextLocalId(tx),
    workoutClientId: row.clientId,
    exerciseId: p.exerciseId,
    position: p.position,
    done: false,
    plannedSets: p.sets,
    repsMin: p.repsMin,
    repsMax: p.repsMax,
    superset: p.superset,
    updatedAt: vars.startedAt,
  }));
  tx.insert(workoutExercises).values(items).run();
  return { row, items };
};

/** Состав тренировки для сервера: те же clientId, что у строк телефона */
const itemsPayload = (items: ItemRow[]) =>
  items.map((i) => ({
    clientId: i.clientId,
    exerciseId: i.exerciseId,
    position: i.position,
    plannedSets: i.plannedSets,
    repsMin: i.repsMin,
    repsMax: i.repsMax,
    superset: i.superset,
  }));

export const startWorkout = (db: LocalDb, complexId?: number): WorkoutRow =>
  db.transaction((tx) => {
    const existing = currentWorkoutRow(tx);
    if (existing) return existing;
    const settings = profileOf(tx);
    const today = localToday(settings.timeZone);
    const program = settings.activeProgramClientId
      ? tx.select().from(programs).where(eq(programs.clientId, settings.activeProgramClientId)).get()
      : undefined;
    const ordered = program
      ? tx
          .select()
          .from(complexes)
          .where(eq(complexes.programClientId, program.clientId))
          .orderBy(asc(complexes.position))
          .all()
      : [];
    const day = tx.select().from(planDays).where(eq(planDays.date, today)).get();
    const complex =
      complexId != null
        ? tx.select().from(complexes).where(byUiId(complexes, complexId)).get()
        : ordered.find(
            (c) =>
              c.clientId ===
              (day?.suggestedComplexClientId ??
                nextInQueue(
                  settings.nextComplexClientId,
                  ordered.map((o) => o.clientId),
                )),
          );
    if (!complex) throw new Error('Нет активной программы с тренировками — возьми шаблон или собери свою.');
    const startedAt = now();
    const { row, items } = insertWorkout(tx, complex, {
      date: today,
      startedAt,
      warmupMinutes: resolveWarmup(complex, settings),
    });
    // Выбранный вручную комплекс засчитывается и при вечернем «да» — как на сервере
    if (day?.status === 'PENDING')
      tx.update(planDays).set({ suggestedComplexClientId: complex.clientId }).where(eq(planDays.clientId, day.clientId)).run();

    enqueue(tx, {
      type: 'workout.start',
      entity: 'Workout',
      clientId: row.clientId,
      at: startedAt,
      touched: items.map((i) => i.clientId),
      payload: { complexClientId: complex.clientId, date: today, items: itemsPayload(items) },
    });
    return tx.select().from(workouts).where(eq(workouts.clientId, row.clientId)).get()!;
  });

// ── Подходы ─────────────────────────────────────────────────────────────────

/** Подход в конец упражнения — в идущую тренировку или исправлением прошедшей */
export const addSet = (db: LocalDb, vars: AddSetVars): number =>
  db.transaction((tx) => {
    const { item, workout } = mustItem(tx, vars.itemId);
    // Повтор того же нажатия — подход уже записан
    if (tx.select({ id: workoutSets.clientId }).from(workoutSets).where(eq(workoutSets.clientId, vars.clientId)).get())
      return uiIdOf(workout);
    if (workout.mode === 'SIMPLE') throw new Error('В простом режиме подходы не записываются.');
    const measure = measureOf(tx, item.exerciseId);
    // На время вес не пишется, даже если его прислали
    const weight = isTimed(measure) ? 0 : (vars.weight ?? 0);
    if (!isValidSet(measure, weight, vars.reps)) throw new Error(setError(measure));
    const closed = workout.status !== 'IN_PROGRESS';
    const last = tx
      .select({ number: workoutSets.number })
      .from(workoutSets)
      .where(eq(workoutSets.workoutExerciseClientId, item.clientId))
      .orderBy(desc(workoutSets.number))
      .get();
    // В закрытую тренировку время не пишем: подход сделан не «сейчас»
    const timing = closed
      ? { doneAt: null, workSeconds: null, restTargetSeconds: null }
      : {
          doneAt: clampAt(vars.doneAt, workout.startedAt),
          workSeconds: vars.workSeconds ?? null,
          restTargetSeconds: vars.restTargetSeconds ?? null,
        };
    tx.insert(workoutSets)
      .values({
        clientId: vars.clientId,
        localId: nextLocalId(tx),
        workoutExerciseClientId: item.clientId,
        number: (last?.number ?? 0) + 1,
        weight,
        reps: vars.reps,
        ...timing,
        updatedAt: now(),
      })
      .run();
    // В прошедшей тренировке «сделано» уже не нажать — подход сам отмечает упражнение
    if (closed && !item.done) tx.update(workoutExercises).set({ done: true }).where(eq(workoutExercises.clientId, item.clientId)).run();
    enqueue(tx, {
      type: 'set.add',
      entity: 'WorkoutSet',
      clientId: vars.clientId,
      at: timing.doneAt ?? now(),
      payload: { itemClientId: item.clientId, weight, reps: vars.reps, ...timing },
    });
    return uiIdOf(workout);
  });

export const updateSet = (db: LocalDb, vars: UpdateSetVars): number =>
  db.transaction((tx) => {
    const set = findSetRow(tx, vars);
    if (!set) throw new Error('Подход не найден.');
    const item = tx.select().from(workoutExercises).where(eq(workoutExercises.clientId, set.workoutExerciseClientId)).get()!;
    const measure = measureOf(tx, item.exerciseId);
    const weight = isTimed(measure) ? 0 : (vars.weight ?? 0);
    if (!isValidSet(measure, weight, vars.reps)) throw new Error(setError(measure));
    tx.update(workoutSets).set({ weight, reps: vars.reps }).where(eq(workoutSets.clientId, set.clientId)).run();
    enqueue(tx, {
      type: 'set.update',
      entity: 'WorkoutSet',
      clientId: set.clientId,
      payload: { weight, reps: vars.reps },
    });
    return workoutIdOf(tx, item.workoutClientId);
  });

/** Удалить подход; номера следующих сдвигаются, как на сервере */
export const deleteSet = (db: LocalDb, vars: DeleteSetVars): number | null =>
  db.transaction((tx) => {
    const set = findSetRow(tx, vars);
    // Уже удалён — это и был нужный результат
    if (!set) return null;
    tx.delete(workoutSets).where(eq(workoutSets.clientId, set.clientId)).run();
    tx.update(workoutSets)
      .set({ number: sql`${workoutSets.number} - 1` })
      .where(and(eq(workoutSets.workoutExerciseClientId, set.workoutExerciseClientId), gt(workoutSets.number, set.number)))
      .run();
    enqueue(tx, { type: 'set.delete', entity: 'WorkoutSet', clientId: set.clientId, payload: {} });
    const item = tx
      .select({ workoutClientId: workoutExercises.workoutClientId })
      .from(workoutExercises)
      .where(eq(workoutExercises.clientId, set.workoutExerciseClientId))
      .get();
    return item ? workoutIdOf(tx, item.workoutClientId) : null;
  });

// ── Упражнения ──────────────────────────────────────────────────────────────

/** Замена: «только сегодня» или ещё и «в комплексе». Подходы старого упражнения к аналогу не относятся */
export const replaceItem = (db: LocalDb, vars: { itemId: number; exerciseId: number; inComplex?: boolean }): number =>
  db.transaction((tx) => {
    const { item, workout } = mustItem(tx, vars.itemId);
    if (workout.status !== 'IN_PROGRESS') throw new Error('Тренировка уже закрыта.');
    measureOf(tx, vars.exerciseId);
    tx.delete(workoutSets).where(eq(workoutSets.workoutExerciseClientId, item.clientId)).run();
    tx.update(workoutExercises)
      .set({
        exerciseId: vars.exerciseId,
        // Упражнение, стоявшее в комплексе изначально: повторная замена не теряет его
        replacedExerciseId: item.replacedExerciseId ?? item.exerciseId,
        done: false,
      })
      .where(eq(workoutExercises.clientId, item.clientId))
      .run();
    // Комплекс поправит сервер — pull привезёт его новым
    enqueue(tx, {
      type: 'item.replace',
      entity: 'WorkoutExercise',
      clientId: item.clientId,
      payload: { exerciseId: vars.exerciseId, inComplex: !!vars.inComplex },
    });
    return uiIdOf(workout);
  });

/** Ещё упражнения в конец тренировки со стандартным планом подходов */
export const addItems = (db: LocalDb, vars: { workoutId: number; exerciseIds: number[]; inComplex?: boolean }): void =>
  db.transaction((tx) => {
    const workout = mustWorkout(tx, vars.workoutId);
    if (vars.inComplex && workout.status !== 'IN_PROGRESS')
      throw new Error('В комплекс добавляют только из идущей тренировки.');
    const last = tx
      .select({ position: workoutExercises.position })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutClientId, workout.clientId))
      .orderBy(desc(workoutExercises.position))
      .get();
    const at = now();
    const items = vars.exerciseIds.map((exerciseId, index) => {
      const plan = defaultPlan(measureOf(tx, exerciseId));
      return {
        clientId: newClientId(),
        localId: nextLocalId(tx),
        workoutClientId: workout.clientId,
        exerciseId,
        position: (last?.position ?? 0) + index + 1,
        done: false,
        plannedSets: plan.sets,
        repsMin: plan.repsMin,
        repsMax: plan.repsMax,
        superset: null,
        updatedAt: at,
      };
    });
    if (!items.length) return;
    tx.insert(workoutExercises).values(items).run();
    enqueue(tx, {
      type: 'item.add',
      entity: 'Workout',
      clientId: workout.clientId,
      touched: items.map((i) => i.clientId),
      payload: {
        inComplex: !!vars.inComplex,
        items: items.map((i) => ({ clientId: i.clientId, exerciseId: i.exerciseId })),
      },
    });
  });

/** Убрать упражнение с подходами. Последнее не убираем — это удаление тренировки целиком */
export const removeItem = (db: LocalDb, itemId: number): number =>
  db.transaction((tx) => {
    const { item, workout } = mustItem(tx, itemId);
    const count = tx
      .select({ clientId: workoutExercises.clientId })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutClientId, workout.clientId))
      .all().length;
    if (count <= 1) throw new Error('Это последнее упражнение — удали тренировку целиком.');
    tx.delete(workoutSets).where(eq(workoutSets.workoutExerciseClientId, item.clientId)).run();
    tx.delete(workoutExercises).where(eq(workoutExercises.clientId, item.clientId)).run();
    enqueue(tx, { type: 'item.remove', entity: 'WorkoutExercise', clientId: item.clientId, payload: {} });
    return uiIdOf(workout);
  });

// ── Разминка и заминка ──────────────────────────────────────────────────────

/** Отметка времени разминки или заминки: пишется только первая, как на сервере */
const markOnce = (
  db: LocalDb,
  workoutId: number,
  type: 'warmup.finish' | 'cooldown.start' | 'cooldown.finish',
): void =>
  db.transaction((tx) => {
    const workout = mustWorkout(tx, workoutId);
    const at = clampAt(now(), workout.startedAt);
    const field =
      type === 'warmup.finish'
        ? workout.warmupMinutes !== null && !workout.warmupFinishedAt && { warmupFinishedAt: at }
        : type === 'cooldown.start'
          ? !workout.cooldownStartedAt && { cooldownStartedAt: at }
          : workout.cooldownStartedAt && !workout.cooldownFinishedAt && { cooldownFinishedAt: at };
    if (!field) return;
    tx.update(workouts).set(field).where(eq(workouts.clientId, workout.clientId)).run();
    enqueue(tx, { type, entity: 'Workout', clientId: workout.clientId, at, payload: {} });
  });

export const warmupFinish = (db: LocalDb, workoutId: number) => markOnce(db, workoutId, 'warmup.finish');
export const cooldownStart = (db: LocalDb, workoutId: number) => markOnce(db, workoutId, 'cooldown.start');
export const cooldownFinish = (db: LocalDb, workoutId: number) => markOnce(db, workoutId, 'cooldown.finish');

/** Кандидаты в заминку: заминочные растяжки справочника, кроме исключённых человеком */
const cooldownCandidates = (tx: Pick<LocalDb, 'select'>) => {
  const excluded = tx
    .select({ id: stretchExclusions.stretchId })
    .from(stretchExclusions)
    .all()
    .map((e) => e.id);
  const bodyOrder = new Map(tx.select().from(muscles).all().map((m) => [m.id, m.bodyOrder]));
  return tx
    .select()
    .from(stretches)
    .where(and(eq(stretches.kind, 'COOLDOWN'), notInArray(stretches.id, excluded)))
    .all()
    .map(
      (s): CooldownCandidate => ({
        id: s.id,
        position: s.position,
        holdSeconds: s.holdSeconds,
        perSide: s.perSide,
        hasImage: !!s.imageUrl,
        muscles: s.muscleIds.map((id) => ({ id, bodyOrder: bodyOrder.get(id) ?? 0 })),
      }),
    );
};

/**
 * Заминка под тренировку — собирается один раз и сохраняется, как CooldownService.build.
 * onlyDone — учитывать только сделанные упражнения (досрочное завершение)
 */
export const ensureCooldown = (tx: LocalTx, workout: WorkoutRow, onlyDone: boolean): void => {
  const saved = tx
    .select({ id: workoutStretches.clientId })
    .from(workoutStretches)
    .where(eq(workoutStretches.workoutClientId, workout.clientId))
    .get();
  if (saved) return;
  const { items } = loadWorkout(tx, workout);
  const exerciseRows = new Map(
    (items.length
      ? tx
          .select()
          .from(exercises)
          .where(
            inArray(
              exercises.id,
              items.map((i) => i.exerciseId),
            ),
          )
          .all()
      : []
    ).map((e) => [e.id, e]),
  );
  const bodyOrder = new Map(tx.select().from(muscles).all().map((m) => [m.id, m.bodyOrder]));
  const previous = tx
    .selectDistinct({ clientId: workouts.clientId, startedAt: workouts.startedAt })
    .from(workouts)
    .innerJoin(workoutStretches, eq(workoutStretches.workoutClientId, workouts.clientId))
    .where(ne(workouts.clientId, workout.clientId))
    .orderBy(desc(workouts.startedAt))
    .limit(RECENT_COOLDOWNS)
    .all();
  const recent = recentPenalties(
    previous.map(({ clientId }) =>
      tx
        .select({ id: workoutStretches.stretchId })
        .from(workoutStretches)
        .where(eq(workoutStretches.workoutClientId, clientId))
        .all()
        .map((s) => s.id),
    ),
  );
  const { main, optional } = buildCooldown({
    exercises: items
      .filter((item) => !onlyDone || item.done)
      .map((item) => ({
        plannedSets: item.plannedSets,
        muscles: (exerciseRows.get(item.exerciseId)?.muscles ?? []).map((m) => ({
          role: m.role,
          muscle: { id: m.muscleId, bodyOrder: bodyOrder.get(m.muscleId) ?? 0 },
        })),
      })),
    candidates: cooldownCandidates(tx),
    recent,
  });
  const at = now();
  const rows = [
    ...main.map((s) => ({ stretchId: s.id, block: 'MAIN' as const })),
    ...optional.map((s) => ({ stretchId: s.id, block: 'OPTIONAL' as const })),
  ].map((r, index) => ({
    ...r,
    clientId: newClientId(),
    localId: nextLocalId(tx),
    workoutClientId: workout.clientId,
    position: index + 1,
    updatedAt: at,
  }));
  if (!rows.length) return;
  tx.insert(workoutStretches).values(rows).run();
  enqueue(tx, {
    type: 'cooldown.build',
    entity: 'Workout',
    clientId: workout.clientId,
    touched: rows.map((r) => r.clientId),
    payload: {
      stretches: rows.map((r) => ({ clientId: r.clientId, stretchId: r.stretchId, block: r.block, position: r.position })),
    },
  });
};

const mustCooldownRow = (tx: LocalTx, workout: WorkoutRow, stretchId: number) => {
  const row = tx
    .select()
    .from(workoutStretches)
    .where(and(eq(workoutStretches.workoutClientId, workout.clientId), eq(workoutStretches.stretchId, stretchId)))
    .get();
  if (!row) throw new Error('Этой растяжки нет в заминке.');
  return row;
};

/** Замена растяжки: что ещё не в этой заминке и тянет те же мышцы */
const pickReplacement = (tx: LocalTx, workout: WorkoutRow, stretchId: number) => {
  const taken = tx
    .select({ id: workoutStretches.stretchId })
    .from(workoutStretches)
    .where(eq(workoutStretches.workoutClientId, workout.clientId))
    .all()
    .map((s) => s.id);
  const candidates = cooldownCandidates(tx);
  const removed = candidates.find((c) => c.id === stretchId) ?? {
    id: stretchId,
    position: null,
    holdSeconds: 0,
    perSide: false,
    hasImage: false,
    muscles: (tx.select({ ids: stretches.muscleIds }).from(stretches).where(eq(stretches.id, stretchId)).get()?.ids ?? []).map(
      (id) => ({ id, bodyOrder: 0 }),
    ),
  };
  return replacementFor(
    removed,
    candidates.filter((c) => c.id !== stretchId && !taken.includes(c.id)),
  );
};

/** «Не предлагать»: растяжка исключается навсегда, а в этой заминке меняется на другую на те же мышцы */
export const excludeCooldownStretch = (db: LocalDb, workoutId: number, stretchId: number): void =>
  db.transaction((tx) => {
    const workout = mustWorkout(tx, workoutId);
    const row = mustCooldownRow(tx, workout, stretchId);
    const next = pickReplacement(tx, workout, stretchId);
    const exclusion = tx.select().from(stretchExclusions).where(eq(stretchExclusions.stretchId, stretchId)).get();
    const exclusionClientId = exclusion?.clientId ?? newClientId();
    if (!exclusion) tx.insert(stretchExclusions).values({ clientId: exclusionClientId, stretchId, updatedAt: now() }).run();
    if (next) tx.update(workoutStretches).set({ stretchId: next.id }).where(eq(workoutStretches.clientId, row.clientId)).run();
    else tx.delete(workoutStretches).where(eq(workoutStretches.clientId, row.clientId)).run();
    enqueue(tx, {
      type: 'cooldown.exclude',
      entity: 'WorkoutStretch',
      clientId: row.clientId,
      touched: [exclusionClientId],
      payload: { stretchId, nextStretchId: next?.id ?? null, exclusionClientId },
    });
  });

/** Готовый комплекс вместо набора заминки. После её начала нельзя: человек уже видит шаги */
export const applyRoutineToCooldown = (db: LocalDb, workoutId: number, routineId: number): void =>
  db.transaction((tx) => {
    const workout = mustWorkout(tx, workoutId);
    if (workout.cooldownStartedAt) throw new Error('Заминка уже начата.');
    const routine = tx.select().from(stretchRoutines).where(eq(stretchRoutines.id, routineId)).get();
    if (!routine) throw new Error('Комплекс не найден.');
    const allowed = new Set(cooldownCandidates(tx).map((s) => s.id));
    const stretchIds = routine.stretchIds.filter((id) => allowed.has(id));
    // Исключённые растяжки выпадают; если выпали все, заминку не обнуляем
    if (!stretchIds.length) throw new Error('Все растяжки этого комплекса исключены.');
    const at = now();
    const rows = stretchIds.map((stretchId, index) => ({
      clientId: newClientId(),
      localId: nextLocalId(tx),
      workoutClientId: workout.clientId,
      stretchId,
      block: 'MAIN' as const,
      position: index + 1,
      updatedAt: at,
    }));
    tx.delete(workoutStretches).where(eq(workoutStretches.workoutClientId, workout.clientId)).run();
    tx.insert(workoutStretches).values(rows).run();
    enqueue(tx, {
      type: 'cooldown.routine',
      entity: 'Workout',
      clientId: workout.clientId,
      touched: rows.map((r) => r.clientId),
      payload: {
        routineId,
        stretches: rows.map((r) => ({ clientId: r.clientId, stretchId: r.stretchId, position: r.position })),
      },
    });
  });

/**
 * «Другая»: не подошла только сейчас, в исключения не пишем. Замены нет — ошибка, а не удаление:
 * человек просил другую растяжку, а не сократить заминку
 */
export const swapCooldownStretch = (db: LocalDb, workoutId: number, stretchId: number): void =>
  db.transaction((tx) => {
    const workout = mustWorkout(tx, workoutId);
    const row = mustCooldownRow(tx, workout, stretchId);
    const next = pickReplacement(tx, workout, stretchId);
    if (!next) throw new Error('Другой растяжки на эти мышцы нет.');
    tx.update(workoutStretches).set({ stretchId: next.id }).where(eq(workoutStretches.clientId, row.clientId)).run();
    enqueue(tx, {
      type: 'cooldown.swap',
      entity: 'WorkoutStretch',
      clientId: row.clientId,
      payload: { nextStretchId: next.id },
    });
  });

/** Ещё растяжка в конец заминки: случайная или на выбранную мышцу */
export const addCooldownStretch = (db: LocalDb, workoutId: number, muscleId?: number): void =>
  db.transaction((tx) => {
    const workout = mustWorkout(tx, workoutId);
    const taken = tx
      .select({ stretchId: workoutStretches.stretchId, position: workoutStretches.position })
      .from(workoutStretches)
      .where(eq(workoutStretches.workoutClientId, workout.clientId))
      .all();
    const takenIds = new Set(taken.map((t) => t.stretchId));
    const exerciseIds = loadWorkout(tx, workout).items.map((i) => i.exerciseId);
    const trained = new Set(
      (exerciseIds.length ? tx.select().from(exercises).where(inArray(exercises.id, exerciseIds)).all() : []).flatMap((e) =>
        e.muscles.map((m) => m.muscleId),
      ),
    );
    const stretch = additionFor(
      cooldownCandidates(tx).filter((c) => !takenIds.has(c.id)),
      trained,
      muscleId,
    );
    if (!stretch) throw new Error(muscleId ? 'На эту мышцу растяжек больше нет.' : 'Все растяжки уже в заминке.');
    const row = {
      clientId: newClientId(),
      localId: nextLocalId(tx),
      workoutClientId: workout.clientId,
      stretchId: stretch.id,
      block: 'OPTIONAL' as const,
      position: Math.max(0, ...taken.map((t) => t.position)) + 1,
      updatedAt: now(),
    };
    tx.insert(workoutStretches).values(row).run();
    enqueue(tx, {
      type: 'cooldown.add',
      entity: 'Workout',
      clientId: workout.clientId,
      touched: [row.clientId],
      payload: { clientId: row.clientId, stretchId: row.stretchId, position: row.position },
    });
  });

// ── Завершение ──────────────────────────────────────────────────────────────

/** Серия по отметкам дней телефона — сервер пересчитает так же после push */
export const recalcStreak = (tx: LocalTx) => {
  const days = tx
    .select({ status: planDays.status })
    .from(planDays)
    .where(inArray(planDays.status, ['DONE', 'MISSED']))
    .orderBy(asc(planDays.date))
    .all();
  const { current, best } = streakOf(days.map((d) => d.status));
  tx.update(profile).set({ currentStreak: current, bestStreak: best }).run();
};

/**
 * Засчитывание — как WorkoutService.complete: статус, сделанные упражнения, день плана, очередь, серия.
 * forDayClientId — день указан явно (исправление отметки); без него засчитывается свой день тренировки.
 * Операцию для сервера ставит вызывающий: завершение, вечернее «да» и исправление отправляются по-разному
 */
export const completeInTx = (
  tx: LocalTx,
  workout: WorkoutRow,
  finishedAt: string,
  forDayClientId?: string,
): void => {
  const loaded = loadWorkout(tx, workout);
  const detailed = workout.mode === 'DETAILED';
  tx.update(workouts).set({ status: 'FINISHED', finishedAt }).where(eq(workouts.clientId, workout.clientId)).run();
  // Детальная: сделано то, где есть подходы; простая — весь комплекс
  const withSets = loaded.items.filter((i) => !detailed || i.sets.length).map((i) => i.clientId);
  if (withSets.length) tx.update(workoutExercises).set({ done: true }).where(inArray(workoutExercises.clientId, withSets)).run();

  // День тренировки: ждал её или был пропущен утром — засчитан. Внеплановую привяжет сервер
  const day = forDayClientId
    ? tx.select().from(planDays).where(eq(planDays.clientId, forDayClientId)).get()
    : tx.select().from(planDays).where(eq(planDays.date, workout.date)).get();
  if (day && (forDayClientId || day.status === 'PENDING' || (day.status === 'MISSED' && !day.workoutClientId)))
    tx.update(planDays)
      .set({ status: 'DONE', workoutClientId: workout.clientId })
      .where(eq(planDays.clientId, day.clientId))
      .run();

  const settings = profileOf(tx);
  const ordered = settings.activeProgramClientId
    ? tx
        .select({ clientId: complexes.clientId })
        .from(complexes)
        .where(eq(complexes.programClientId, settings.activeProgramClientId))
        .orderBy(asc(complexes.position))
        .all()
        .map((c) => c.clientId)
    : [];
  const next = advanceQueue(workout.complexClientId, ordered);
  tx.update(profile)
    .set({ missedInRow: 0, ...(next ? { nextComplexClientId: next } : {}) })
    .run();
  recalcStreak(tx);
};

/**
 * «Завершить» идущую тренировку. Заминка уходит на сервер раньше завершения:
 * так сервер возьмёт её, а не соберёт свою
 */
export const finishWorkout = (db: LocalDb, vars: FinishVars): number =>
  db.transaction((tx) => {
    const workout = mustWorkout(tx, vars.id);
    // Повтор нажатия — тренировка уже закрыта
    if (workout.status !== 'IN_PROGRESS') return uiIdOf(workout);
    const loaded = loadWorkout(tx, workout);
    const detailed = workout.mode === 'DETAILED';
    if (detailed && !loaded.items.some(isItemDone)) throw new Error('Пока не сделано ни одного упражнения — засчитывать нечего.');
    const lastDone = loaded.items
      .flatMap((i) => i.sets.flatMap((s) => (s.doneAt ? [s.doneAt] : [])))
      .reduce((latest, at) => (at > latest ? at : latest), workout.startedAt);
    const finishedAt = clampAt(vars.finishedAt, lastDone);

    completeInTx(tx, workout, finishedAt);
    ensureCooldown(tx, { ...workout, status: 'FINISHED' }, detailed);
    enqueue(tx, {
      type: 'workout.finish',
      entity: 'Workout',
      clientId: workout.clientId,
      at: finishedAt,
      payload: { finishedAt },
    });
    return uiIdOf(workout);
  });

/**
 * Тренировка, добавленная вручную из статистики: сразу засчитана, как WorkoutService.createManual.
 * Начало и конец совпадают — длительности она не знает; прошлая — полдень того дня, чтобы не съехать на соседний.
 * Идущая тренировка не трогается. Подходы дописываются потом на экране исправления
 */
export const addManualWorkout = (db: LocalDb, vars: { complexId: number; date: string }): number =>
  db.transaction((tx) => {
    const today = localToday(profileOf(tx).timeZone);
    if (vars.date > today) throw new Error('Тренировку в будущем добавить нельзя.');
    const complex = tx.select().from(complexes).where(byUiId(complexes, vars.complexId)).get();
    if (!complex) throw new Error('Комплекс не найден.');
    const at = vars.date === today ? now() : `${vars.date}T12:00:00.000Z`;
    const { row, items } = insertWorkout(tx, complex, { date: vars.date, startedAt: at, warmupMinutes: null });
    const day = tx.select().from(planDays).where(eq(planDays.date, vars.date)).get();
    if (day?.status === 'PENDING')
      tx.update(planDays).set({ suggestedComplexClientId: complex.clientId }).where(eq(planDays.clientId, day.clientId)).run();
    const workout = tx.select().from(workouts).where(eq(workouts.clientId, row.clientId)).get()!;
    completeInTx(tx, workout, at);
    enqueue(tx, {
      type: 'workout.manual',
      entity: 'Workout',
      clientId: row.clientId,
      at,
      touched: items.map((i) => i.clientId),
      payload: { complexClientId: complex.clientId, date: vars.date, at, items: itemsPayload(items) },
    });
    return uiIdOf(workout);
  });

/** Удалить строки тренировки: подходы, упражнения, заминку и саму её */
export const dropWorkout = (tx: LocalTx, workout: WorkoutRow) => {
  const itemIds = tx
    .select({ clientId: workoutExercises.clientId })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutClientId, workout.clientId))
    .all()
    .map((i) => i.clientId);
  if (itemIds.length) tx.delete(workoutSets).where(inArray(workoutSets.workoutExerciseClientId, itemIds)).run();
  tx.delete(workoutExercises).where(eq(workoutExercises.workoutClientId, workout.clientId)).run();
  tx.delete(workoutStretches).where(eq(workoutStretches.workoutClientId, workout.clientId)).run();
  tx.delete(workouts).where(eq(workouts.clientId, workout.clientId)).run();
};

/** Отменить незавершённую тренировку: очередь комплексов не сдвигается */
export const discardWorkout = (db: LocalDb, id: number): void =>
  db.transaction((tx) => {
    const workout = findWorkoutRow(tx, id);
    if (!workout || workout.status !== 'IN_PROGRESS') return;
    dropWorkout(tx, workout);
    enqueue(tx, { type: 'workout.discard', entity: 'Workout', clientId: workout.clientId, payload: {} });
  });

/**
 * Удалить закрытую тренировку: день освобождается — давний становится пропуском,
 * вчерашний и новее снова ждут тренировки (как WorkoutService.remove), серия пересчитывается
 */
export const deleteWorkout = (db: LocalDb, id: number): void =>
  db.transaction((tx) => {
    const workout = findWorkoutRow(tx, id);
    if (!workout || workout.status === 'IN_PROGRESS') throw new Error('Тренировка не найдена.');
    const answerFrom = addDays(localToday(profileOf(tx).timeZone), -1);
    for (const day of tx.select().from(planDays).where(eq(planDays.workoutClientId, workout.clientId)).all())
      tx.update(planDays)
        .set({ status: day.date < answerFrom ? 'MISSED' : 'PENDING', workoutClientId: null })
        .where(eq(planDays.clientId, day.clientId))
        .run();
    dropWorkout(tx, workout);
    recalcStreak(tx);
    enqueue(tx, { type: 'workout.delete', entity: 'Workout', clientId: workout.clientId, payload: {} });
  });

/** Тренировки с заминкой, но без отметки в базе: собрать её при открытии, как GET workout/:id/cooldown */
export const cooldownFor = (db: LocalDb, id: number): WorkoutRow =>
  db.transaction((tx) => {
    const workout = mustWorkout(tx, id);
    ensureCooldown(tx, workout, workout.mode === 'DETAILED' && workout.status !== 'IN_PROGRESS');
    return workout;
  });
