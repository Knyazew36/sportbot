import { and, asc, eq, gte, isNull } from 'drizzle-orm';

import { newClientId } from '@sportbot/api/entities/workout';
import { activePauseOf, nextInQueue } from '@sportbot/api/lib/day';
import { addDays, localToday, weekdayOf } from '@sportbot/api/lib/time';

import type { LocalDb } from '@/shared/db';
import { complexes, pauses, planDays, profile, programs, workouts } from '@/shared/db/schema';
import { enqueue, type LocalTx, nextLocalId } from '@/shared/sync/outbox';

import { byUiId } from '../../read-common';
import { completeInTx, dropWorkout, profileOf, recalcStreak } from '../workout/write-workout';

// Ответы дня и пауза на телефоне — порт PollService, PlanDayService.markMissed и PauseService.
// День, заведённый тут, уходит на сервер со своим clientId: сервер заведёт его с тем же

/** Отметку можно исправить в течение 7 дней — как FIX_WINDOW_DAYS на сервере */
const FIX_WINDOW_DAYS = 7;
/** Столько пропусков подряд — предложить паузу, как MISSES_FOR_PAUSE_OFFER */
const MISSES_FOR_PAUSE_OFFER = 3;

type DayRow = typeof planDays.$inferSelect;
type Settings = ReturnType<typeof profileOf>;

const now = () => new Date().toISOString();

const dayOn = (tx: LocalTx, date: string) => tx.select().from(planDays).where(eq(planDays.date, date)).get();

const createDay = (tx: LocalTx, date: string, extra: Partial<DayRow> = {}): DayRow => {
  const row = {
    clientId: newClientId(),
    localId: nextLocalId(tx),
    date,
    type: 'PLANNED' as const,
    status: 'PENDING' as const,
    updatedAt: now(),
    ...extra,
  };
  tx.insert(planDays).values(row).run();
  return dayOn(tx, date)!;
};

/** Сегодняшний день, который ждёт ответа; до утреннего вопроса его ещё нет — заводим */
const todayForAnswer = (tx: LocalTx, settings: Settings, today: string): DayRow => {
  const existing = dayOn(tx, today);
  if (!existing && !settings.trainingDays.includes(weekdayOf(today))) throw new Error('Сегодня не тренировочный день.');
  const day = existing ?? createDay(tx, today);
  if (day.status !== 'PENDING') throw new Error('Ответ на сегодня уже есть.');
  return day;
};

/**
 * Пропуск дня — как markMissed + missDay: перенесённый день снимается, обычный становится пропуском,
 * после трёх подряд — предложение паузы; если завтра не тренировочный — «напомнить завтра?»
 */
const missDay = (tx: LocalTx, settings: Settings, day: DayRow) => {
  if (day.type === 'RESCHEDULED') {
    tx.delete(planDays).where(eq(planDays.clientId, day.clientId)).run();
    return { canReschedule: false, suggestPause: false };
  }
  tx.update(planDays).set({ status: 'MISSED' }).where(eq(planDays.clientId, day.clientId)).run();
  const missedInRow = settings.missedInRow + 1;
  const suggestPause = missedInRow >= MISSES_FOR_PAUSE_OFFER;
  tx.update(profile)
    .set({ missedInRow: suggestPause ? 0 : missedInRow })
    .run();
  recalcStreak(tx);
  const canReschedule = !settings.trainingDays.includes(weekdayOf(addDays(day.date, 1)));
  if (canReschedule)
    tx.update(planDays).set({ rescheduleOfferedAt: now() }).where(eq(planDays.clientId, day.clientId)).run();
  return { canReschedule, suggestPause };
};

/**
 * Засчитать день без «процесса» — как completeFromPlan: начатая в этот день тренировка или новая простая
 * по комплексу дня. clientId простой тренировки уходит на сервер — у него будет та же строка
 */
const completeFromPlan = (tx: LocalTx, settings: Settings, day: DayRow, forDay: boolean): string => {
  const started = tx
    .select()
    .from(workouts)
    .where(and(eq(workouts.date, day.date), eq(workouts.status, 'IN_PROGRESS')))
    .get();
  if (started) {
    completeInTx(tx, started, now(), forDay ? day.clientId : undefined);
    return started.clientId;
  }
  const program = settings.activeProgramClientId
    ? tx.select().from(programs).where(eq(programs.clientId, settings.activeProgramClientId)).get()
    : undefined;
  const ordered = program
    ? tx.select().from(complexes).where(eq(complexes.programClientId, program.clientId)).orderBy(asc(complexes.position)).all()
    : [];
  const complexClientId =
    day.suggestedComplexClientId ??
    nextInQueue(
      settings.nextComplexClientId,
      ordered.map((c) => c.clientId),
    );
  const complex = ordered.find((c) => c.clientId === complexClientId);
  // Упражнения простой тренировки заведёт сервер — их строки придут pull
  const at = now();
  const row = {
    clientId: newClientId(),
    localId: nextLocalId(tx),
    complexClientId: complex?.clientId ?? null,
    complexName: complex?.name ?? 'Тренировка',
    cardioName: complex?.cardioName ?? null,
    cardioMinutes: complex?.cardioMinutes ?? null,
    date: day.date,
    mode: 'SIMPLE' as const,
    status: 'IN_PROGRESS' as const,
    unplanned: false,
    startedAt: at,
    updatedAt: at,
  };
  tx.insert(workouts).values(row).run();
  completeInTx(tx, tx.select().from(workouts).where(eq(workouts.clientId, row.clientId)).get()!, at, forDay ? day.clientId : undefined);
  return row.clientId;
};

const streakOfProfile = (tx: LocalTx) => tx.select({ current: profile.currentStreak }).from(profile).get()?.current ?? 0;

// ── Сегодня ─────────────────────────────────────────────────────────────────

/** «Другая тренировка» до начала: выбор пишется в день и переживает перезаход */
export const pickComplex = (db: LocalDb, complexId: number): void =>
  db.transaction((tx) => {
    const settings = profileOf(tx);
    const today = localToday(settings.timeZone);
    const complex = tx.select().from(complexes).where(byUiId(complexes, complexId)).get();
    if (!complex || complex.programClientId !== settings.activeProgramClientId)
      throw new Error('Этого комплекса нет в активной программе.');
    const existing = dayOn(tx, today);
    let day: DayRow;
    if (existing?.status === 'PENDING') {
      tx.update(planDays).set({ suggestedComplexClientId: complex.clientId }).where(eq(planDays.clientId, existing.clientId)).run();
      day = existing;
    } else if (!existing && settings.trainingDays.includes(weekdayOf(today))) {
      // До утреннего вопроса день ещё не заведён — заводим сами, утренний шаг выбор не перетрёт
      day = createDay(tx, today, { suggestedComplexClientId: complex.clientId });
    } else throw new Error('Сегодня тренировка не ждёт.');
    enqueue(tx, {
      type: 'day.pick',
      entity: 'PlanDay',
      clientId: day.clientId,
      payload: { date: today, complexClientId: complex.clientId },
    });
  });

/** «Сегодня не буду» — как утреннее «нет» в боте */
export const skipDay = (db: LocalDb) =>
  db.transaction((tx) => {
    const settings = profileOf(tx);
    const today = localToday(settings.timeZone);
    const day = todayForAnswer(tx, settings, today);
    if (!day.morningAnswer) tx.update(planDays).set({ morningAnswer: 'NO' }).where(eq(planDays.clientId, day.clientId)).run();
    const outcome = missDay(tx, settings, day);
    enqueue(tx, { type: 'day.skip', entity: 'PlanDay', clientId: day.clientId, payload: { date: today } });
    return outcome;
  });

/** Вечерний ответ: «да» засчитывает комплекс дня, «нет» — пропуск */
export const eveningAnswer = (db: LocalDb, yes: boolean) =>
  db.transaction((tx) => {
    const settings = profileOf(tx);
    const today = localToday(settings.timeZone);
    const day = todayForAnswer(tx, settings, today);
    if (day.eveningAnswer) throw new Error('На этот вопрос ответ уже есть.');
    tx.update(planDays)
      .set({ eveningAnswer: yes ? 'YES' : 'NO' })
      .where(eq(planDays.clientId, day.clientId))
      .run();
    const fresh = dayOn(tx, today)!;
    const workoutClientId = yes ? completeFromPlan(tx, settings, fresh, false) : undefined;
    const missed = yes ? null : missDay(tx, settings, fresh);
    enqueue(tx, {
      type: 'day.evening',
      entity: 'PlanDay',
      clientId: day.clientId,
      touched: workoutClientId ? [workoutClientId] : [],
      payload: { date: today, yes, workoutClientId },
    });
    return {
      done: yes,
      currentStreak: streakOfProfile(tx),
      canReschedule: missed?.canReschedule ?? false,
      suggestPause: missed?.suggestPause ?? false,
    };
  });

/** Ответ на «напомнить завтра?» после пропуска сегодняшнего дня */
export const rescheduleAnswer = (db: LocalDb, accept: boolean): void =>
  db.transaction((tx) => {
    const settings = profileOf(tx);
    const today = localToday(settings.timeZone);
    const day = dayOn(tx, today);
    if (!day?.rescheduleOfferedAt) throw new Error('Перенос уже не предлагается.');
    tx.update(planDays).set({ rescheduleOfferedAt: null }).where(eq(planDays.clientId, day.clientId)).run();
    const tomorrow = addDays(day.date, 1);
    if (accept && !dayOn(tx, tomorrow)) createDay(tx, tomorrow, { type: 'RESCHEDULED' });
    enqueue(tx, { type: 'day.reschedule', entity: 'PlanDay', clientId: day.clientId, payload: { accept } });
  });

/** Исправление отметки в пределах недели: «была» засчитывает день, «пропуск» отвязывает тренировку */
export const fixDay = (db: LocalDb, dayId: number, status: 'DONE' | 'MISSED') =>
  db.transaction((tx) => {
    const settings = profileOf(tx);
    const today = localToday(settings.timeZone);
    const day = tx.select().from(planDays).where(byUiId(planDays, dayId)).get();
    const allowed = status === 'DONE' ? ['MISSED', 'PENDING'] : ['DONE', 'PENDING'];
    if (!day || !allowed.includes(day.status) || day.date < addDays(today, -FIX_WINDOW_DAYS) || day.date > today)
      throw new Error('Эту отметку уже нельзя исправить.');
    let workoutClientId: string | undefined;
    if (status === 'DONE') workoutClientId = completeFromPlan(tx, settings, day, true);
    else {
      tx.update(planDays).set({ status: 'MISSED', workoutClientId: null }).where(eq(planDays.clientId, day.clientId)).run();
      // Простая тренировка без подходов удаляется, детальная остаётся в истории — как detachFromDay
      const workout = day.workoutClientId
        ? tx.select().from(workouts).where(eq(workouts.clientId, day.workoutClientId)).get()
        : undefined;
      if (workout?.mode === 'SIMPLE') dropWorkout(tx, workout);
      recalcStreak(tx);
    }
    enqueue(tx, {
      type: 'day.fix',
      entity: 'PlanDay',
      clientId: day.clientId,
      touched: workoutClientId ? [workoutClientId] : [],
      payload: { status, workoutClientId },
    });
    return { currentStreak: streakOfProfile(tx) };
  });

// ── Пауза ───────────────────────────────────────────────────────────────────

/** Пауза «до даты» (включительно) или «до отмены»; действующая — продлевается */
export const startPause = (db: LocalDb, endDate: string | null) =>
  db.transaction((tx) => {
    const settings = profileOf(tx);
    const today = localToday(settings.timeZone);
    if (endDate && endDate < today) throw new Error('Дата окончания уже прошла.');
    const current = activePauseOf(tx.select().from(pauses).all(), today);
    let clientId: string;
    if (current) {
      tx.update(pauses).set({ endDate }).where(eq(pauses.clientId, current.clientId)).run();
      clientId = current.clientId;
    } else {
      clientId = newClientId();
      tx.insert(pauses)
        .values({ clientId, localId: nextLocalId(tx), startDate: today, endDate, origin: 'MANUAL', updatedAt: now() })
        .run();
    }
    // Уже заведённый день, который ждёт ответа, перестаёт быть кандидатом в пропуски
    tx.update(planDays)
      .set({ status: 'PAUSED' })
      .where(and(eq(planDays.status, 'PENDING'), gte(planDays.date, today)))
      .run();
    tx.update(profile).set({ missedInRow: 0 }).run();
    enqueue(tx, { type: 'pause.start', entity: 'Pause', clientId, payload: { endDate } });
    return { startDate: current?.startDate ?? today, endDate };
  });

/** Снять паузу досрочно или вернуться после её срока */
export const endPause = (db: LocalDb): void =>
  db.transaction((tx) => {
    const active = tx.select().from(pauses).where(isNull(pauses.endedAt)).all();
    if (!active.length) return;
    tx.update(pauses).set({ endedAt: now() }).where(isNull(pauses.endedAt)).run();
    enqueue(tx, { type: 'pause.end', entity: 'Pause', clientId: active[0]!.clientId, payload: {} });
  });
