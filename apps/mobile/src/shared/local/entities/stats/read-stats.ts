import { and, asc, eq, gte, inArray, lt } from 'drizzle-orm';

import type {
  StatsDay,
  StatsMark,
  StatsMuscleLoad,
  StatsPoint,
  StatsProgress,
  StatsProgressItem,
  StatsRecord,
  StatsSession,
  StatsSummary,
} from '@sportbot/api/entities/stats';
import type { PaginationMeta } from '@sportbot/api/generated/model';
import { normalizeName } from '@sportbot/api/lib/catalog-search';
import {
  attendance,
  calendarMark,
  exerciseProgress,
  type HistoryRow,
  muscleLoad,
  periodStart,
  progressList,
  recordsFeed,
  sessionsOf,
} from '@sportbot/api/lib/stats';
import { addDays, localToday, weekStart } from '@sportbot/api/lib/time';
import { exerciseRests } from '@sportbot/api/lib/workout-timing';

import type { LocalDb } from '@/shared/db';
import {
  bodyWeights,
  exercises,
  muscles,
  pauses,
  planDays,
  profile,
  workoutExercises,
  workouts,
  workoutSets,
} from '@/shared/db/schema';

import { uiIdOf } from '../../read-common';
import { orNull } from '../program/read-program';
import { DONE_STATUSES } from '../workout/read-workout';

// Статистика из базы телефона — как StatsAppService: те же периоды по умолчанию и те же правила.
// Статистика друга — только с сервера (вызывающий хук передаёт её в REST)

/** Посещаемость по неделям, по умолчанию — 12 недель */
const ATTENDANCE_WEEKS = 12;
/** Вес тела, по умолчанию — 90 дней */
const BODY_WEIGHT_DAYS = 90;
/** Баланс мышц, по умолчанию — 4 недели */
const MUSCLE_WEEKS = 4;
/** Отметку дня можно исправить в течение 7 дней — как FIX_WINDOW_DAYS */
const FIX_WINDOW_DAYS = 7;

const todayOf = (db: LocalDb) => {
  const settings = db.select().from(profile).get();
  return settings ? { settings, today: localToday(settings.timeZone) } : null;
};

const monthStartOf = (day: string) => `${day.slice(0, 7)}-01`;

/** Порядок строк как у сервера: по дате, при равной — по id (созданные на телефоне — после) */
const byServerOrder = (a: { date: string; id: number | null }, b: { date: string; id: number | null }) =>
  a.date.localeCompare(b.date) || (a.id ?? Infinity) - (b.id ?? Infinity);

/**
 * Упражнения засчитанных тренировок с подходами — как historyRows на сервере.
 * Упражнения нет в справочнике телефона — ответ собрать нельзя (отвечает сервер)
 */
export const historyRows = (db: LocalDb, filter: { exerciseIds?: number[] } = {}): HistoryRow[] => {
  const rows = db
    .select({ item: workoutExercises, date: workouts.date })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.clientId, workoutExercises.workoutClientId))
    .where(
      and(
        inArray(workouts.status, [...DONE_STATUSES]),
        filter.exerciseIds ? inArray(workoutExercises.exerciseId, filter.exerciseIds) : undefined,
      ),
    )
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
  const setsOf = new Map<string, typeof sets>();
  for (const s of sets) setsOf.set(s.workoutExerciseClientId, [...(setsOf.get(s.workoutExerciseClientId) ?? []), s]);
  const catalog = new Map(
    db
      .select({ id: exercises.id, name: exercises.name, measure: exercises.measure })
      .from(exercises)
      .all()
      .map((e) => [e.id, e]),
  );
  return rows
    .filter((r) => setsOf.get(r.item.clientId)?.length)
    .map((r) => ({ ...r, id: r.item.id }))
    .sort(byServerOrder)
    .map((r): HistoryRow => {
      const exercise = catalog.get(r.item.exerciseId);
      if (!exercise) throw new Error('missing exercise');
      return {
        id: uiIdOf(r.item),
        exerciseId: r.item.exerciseId,
        name: exercise.name,
        measure: exercise.measure,
        date: r.date,
        sets: withRests(setsOf.get(r.item.clientId)!),
      };
    });
};

/** Подходы с отдыхом перед каждым — для истории упражнения, как у сервера */
const withRests = (rows: { weight: number; reps: number; doneAt: string | null; workSeconds: number | null }[]) => {
  const rests = exerciseRests(rows);
  return rows.map((s, index) => ({ weight: s.weight, reps: s.reps, restBeforeSeconds: rests[index] ?? null }));
};

/** Нет упражнения в справочнике телефона — null, ответит сервер */
const safeHistory = (db: LocalDb, filter?: { exerciseIds?: number[] }) => {
  try {
    return historyRows(db, filter);
  } catch {
    return null;
  }
};

// ── Сводка и посещаемость ───────────────────────────────────────────────────

export const readSummary = (db: LocalDb): StatsSummary | null => {
  const now = todayOf(db);
  if (!now) return null;
  const days = db.select().from(planDays).all();
  const monday = weekStart(now.today);
  return {
    week: attendance(days, monday, addDays(monday, 6), now.today),
    month: attendance(days, monthStartOf(now.today), now.today, now.today),
    currentStreak: now.settings.currentStreak,
    bestStreak: now.settings.bestStreak,
  };
};

/** Посещаемость по неделям — от старых к новым */
export const readAttendanceWeeks = (db: LocalDb, weeks = ATTENDANCE_WEEKS) => {
  const now = todayOf(db);
  if (!now) return null;
  const days = db.select().from(planDays).all();
  const current = weekStart(now.today);
  return Array.from({ length: weeks }, (_, i) => {
    const monday = addDays(current, -7 * (weeks - 1 - i));
    return { weekStart: monday, ...attendance(days, monday, addDays(monday, 6), now.today) };
  });
};

// ── Прогресс ────────────────────────────────────────────────────────────────

/** Список прогресса: мышца — только основная, поиск — подстрока нормализованного названия */
export const readProgressList = (
  db: LocalDb,
  params: { days?: number; filter_muscle?: number; filter_status?: 'growing' | 'stalled'; search?: string; limit?: number },
): StatsProgressItem[] | null => {
  const now = todayOf(db);
  if (!now) return null;
  const query = params.search ? normalizeName(params.search) : '';
  const allowed = db
    .select()
    .from(exercises)
    .all()
    .filter(
      (e) =>
        (!params.filter_muscle || e.muscles.some((m) => m.muscleId === params.filter_muscle && m.role === 'PRIMARY')) &&
        (!query || e.nameNormalized.includes(query)),
    )
    .map((e) => e.id);
  const rows = safeHistory(db, { exerciseIds: allowed });
  if (!rows) return null;
  return progressList(rows, {
    from: periodStart(now.today, params.days),
    today: now.today,
    status: params.filter_status,
    limit: params.limit,
  });
};

export const readProgress = (db: LocalDb, exerciseId: number, days: number): StatsProgress | null => {
  const now = todayOf(db);
  const exercise = db.select().from(exercises).where(eq(exercises.id, exerciseId)).get();
  if (!now || !exercise) return null;
  const rows = safeHistory(db, { exerciseIds: [exerciseId] });
  if (!rows) return null;
  return exerciseProgress(rows, exercise, { from: periodStart(now.today, days), today: now.today, addE1rm: true });
};

/** История тренировок с упражнением — страницами, как на сервере */
export const readSessionsPage = (
  db: LocalDb,
  exerciseId: number,
  page: number,
  limit: number,
): { items: StatsSession[]; meta: PaginationMeta } | null => {
  const rows = safeHistory(db, { exerciseIds: [exerciseId] });
  if (!rows) return null;
  const all = sessionsOf(rows);
  const totalPages = Math.max(1, Math.ceil(all.length / limit));
  return {
    items: all.slice((page - 1) * limit, page * limit),
    meta: { total: all.length, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  };
};

export const readRecords = (db: LocalDb, options: { limit?: number; days?: number }): StatsRecord[] | null => {
  const now = todayOf(db);
  const rows = now && safeHistory(db);
  if (!now || !rows) return null;
  return recordsFeed(rows, {
    from: options.days ? periodStart(now.today, options.days) : undefined,
    limit: options.limit,
  });
};

// ── Тело и мышцы ────────────────────────────────────────────────────────────

export const readBodyWeight = (db: LocalDb, days = BODY_WEIGHT_DAYS): StatsPoint[] | null => {
  const now = todayOf(db);
  if (!now) return null;
  return db
    .select({ date: bodyWeights.date, value: bodyWeights.value })
    .from(bodyWeights)
    .where(gte(bodyWeights.date, addDays(now.today, -days)))
    .orderBy(asc(bodyWeights.date))
    .all();
};

/**
 * Баланс мышц: подходов в неделю в среднем за weeks недель, но не дольше возраста профиля —
 * иначе у новичка вышли бы сплошные нули. «Забыто» — ноль за весь период, если нагрузка вообще была
 */
export const readMuscleLoad = (db: LocalDb, weeks = MUSCLE_WEEKS): StatsMuscleLoad[] | null =>
  orNull(() => {
    const now = todayOf(db);
    if (!now || !now.settings.createdAt) return null;
    const known = Math.ceil(
      (Date.parse(`${now.today}T00:00:00Z`) - Date.parse(now.settings.createdAt) + 1) / (7 * 86_400_000),
    );
    const span = Math.max(1, Math.min(weeks, known));
    const from = addDays(now.today, -(7 * span - 1));
    const items = db
      .select({ item: workoutExercises, mode: workouts.mode })
      .from(workoutExercises)
      .innerJoin(workouts, eq(workouts.clientId, workoutExercises.workoutClientId))
      .where(
        and(
          eq(workoutExercises.done, true),
          inArray(workouts.status, [...DONE_STATUSES]),
          gte(workouts.date, from),
          lt(workouts.date, addDays(now.today, 1)),
        ),
      )
      .all();
    const counts = new Map<string, number>();
    if (items.length)
      for (const s of db
        .select({ item: workoutSets.workoutExerciseClientId })
        .from(workoutSets)
        .where(
          inArray(
            workoutSets.workoutExerciseClientId,
            items.map((i) => i.item.clientId),
          ),
        )
        .all())
        counts.set(s.item, (counts.get(s.item) ?? 0) + 1);
    const catalog = new Map(
      db
        .select({ id: exercises.id, muscles: exercises.muscles })
        .from(exercises)
        .all()
        .map((e) => [e.id, e.muscles]),
    );
    const load = muscleLoad(
      items.map((i) => ({
        detailed: i.mode === 'DETAILED',
        sets: counts.get(i.item.clientId) ?? 0,
        plannedSets: i.item.plannedSets,
        muscles: catalog.get(i.item.exerciseId) ?? [],
      })),
    );
    const anyLoad = [...load.values()].some((v) => v > 0);
    return db
      .select()
      .from(muscles)
      .orderBy(asc(muscles.bodyOrder))
      .all()
      .map((m) => ({
        muscleId: m.id,
        name: m.name,
        sets: Number(((load.get(m.id) ?? 0) / span).toFixed(1)),
        forgotten: anyLoad && !(load.get(m.id) ?? 0),
      }));
  });

// ── Календарь ───────────────────────────────────────────────────────────────

/** Отметки дней месяца; month — «2026-10» */
export const readCalendar = (db: LocalDb, month: string): { date: string; mark: StatsMark }[] | null => {
  const now = todayOf(db);
  if (!now) return null;
  const first = `${month}-01`;
  const next = addDays(first, 32).slice(0, 7) + '-01';
  const days = db.select().from(planDays).where(and(gte(planDays.date, first), lt(planDays.date, next))).all();
  const trained = new Set(
    db
      .select({ date: workouts.date })
      .from(workouts)
      .where(and(gte(workouts.date, first), lt(workouts.date, next), inArray(workouts.status, [...DONE_STATUSES])))
      .all()
      .map((w) => w.date),
  );
  const allPauses = db.select().from(pauses).all();
  const result: { date: string; mark: StatsMark }[] = [];
  for (let date = first; date < next; date = addDays(date, 1))
    result.push({
      date,
      mark: calendarMark(
        now.settings,
        date,
        now.today,
        days.find((d) => d.date === date),
        trained.has(date),
        allPauses,
      ),
    });
  return result;
};

/** Детали дня: тренировки, упражнения, подходы и на что можно исправить отметку */
export const readDay = (db: LocalDb, date: string): StatsDay | null => {
  try {
    return dayOf(db, date);
  } catch {
    // Упражнения нет в справочнике телефона — ответит сервер
    return null;
  }
};

const dayOf = (db: LocalDb, date: string): StatsDay | null => {
    const now = todayOf(db);
    if (!now) return null;
    const day = db.select().from(planDays).where(eq(planDays.date, date)).get();
    const list = db
      .select()
      .from(workouts)
      .where(and(eq(workouts.date, date), inArray(workouts.status, [...DONE_STATUSES])))
      .all()
      .sort((a, b) => (a.id ?? Infinity) - (b.id ?? Infinity));
    const items = list.length
      ? db
          .select()
          .from(workoutExercises)
          .where(
            inArray(
              workoutExercises.workoutClientId,
              list.map((w) => w.clientId),
            ),
          )
          .orderBy(asc(workoutExercises.position))
          .all()
      : [];
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
    const catalog = new Map(
      db
        .select({ id: exercises.id, name: exercises.name, measure: exercises.measure })
        .from(exercises)
        .all()
        .map((e) => [e.id, e]),
    );
    const inWindow = date <= now.today && date >= addDays(now.today, -FIX_WINDOW_DAYS);
    const fixTo: ('DONE' | 'MISSED')[] = [];
    // Те же условия, что у исправления (fixToDone / fixToMissed)
    if (inWindow && day?.type === 'PLANNED') {
      if (day.status === 'MISSED' || day.status === 'PENDING') fixTo.push('DONE');
      if (day.status === 'DONE' || day.status === 'PENDING') fixTo.push('MISSED');
    }
    return {
      date,
      mark: calendarMark(now.settings, date, now.today, day, list.length > 0, db.select().from(pauses).all()),
      dayId: day ? uiIdOf(day) : null,
      fixTo,
      workouts: list.map((w) => ({
        id: uiIdOf(w),
        complexName: w.complexName,
        startedAt: w.startedAt,
        unplanned: w.unplanned,
        simple: w.mode === 'SIMPLE',
        exercises: items
          .filter((i) => i.workoutClientId === w.clientId)
          .map((i) => {
            const exercise = catalog.get(i.exerciseId);
            if (!exercise) throw new Error('missing exercise');
            return {
              name: exercise.name,
              measure: exercise.measure,
              done: i.done,
              sets: sets.filter((s) => s.workoutExerciseClientId === i.clientId).map((s) => ({ weight: s.weight, reps: s.reps })),
              superset: i.superset,
            };
          }),
      })),
    };
};
