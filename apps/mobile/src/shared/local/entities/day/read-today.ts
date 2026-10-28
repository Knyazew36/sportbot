import { and, desc, eq, gt, gte, inArray, lt, lte } from 'drizzle-orm';

import type { DayToday } from '@sportbot/api/entities/day';
import type { DayComplexResponseDto, DayWorkoutResponseDto } from '@sportbot/api/generated/model';
import {
  activePauseOf,
  complexOfDay,
  NEXT_HORIZON_DAYS,
  NEXT_STATES,
  nextTrainingDate,
  resolveWarmup,
  stateOf,
  weekOf,
} from '@sportbot/api/lib/day';
import { addDays, localToday, weekdayOf, weekStart } from '@sportbot/api/lib/time';

import type { LocalDb } from '@/shared/db';
import {
  pauses,
  planDays,
  programs,
  workoutExercises,
  workouts,
  workoutSets,
} from '@/shared/db/schema';

import { limitedZonesOf, uiIdOf } from '../../read-common';
import { readProfileRow } from '../profile/read-profile';
import { complexesOf, exerciseLookup, nextComplexOf, orNull } from '../program/read-program';

type WorkoutRow = typeof workouts.$inferSelect;

const FINISHED = ['FINISHED', 'AUTO_CLOSED'] as const;

/** Сделано упражнений: отмечено или есть подход — как isDone на сервере */
const briefOf = (db: LocalDb, workout: WorkoutRow): DayWorkoutResponseDto | null => {
  const items = db.select().from(workoutExercises).where(eq(workoutExercises.workoutClientId, workout.clientId)).all();
  const withSets = new Set(
    items.length
      ? db
          .select({ item: workoutSets.workoutExerciseClientId })
          .from(workoutSets)
          .where(
            inArray(
              workoutSets.workoutExerciseClientId,
              items.map((i) => i.clientId),
            ),
          )
          .all()
          .map((s) => s.item)
      : [],
  );
  return {
    id: uiIdOf(workout),
    complexName: workout.complexName,
    done: items.filter((i) => i.done || withSets.has(i.clientId)).length,
    total: items.length,
  };
};

/** «Сегодня» — как DayService.today на сервере, только из локальной базы */
export const readToday = (db: LocalDb): DayToday | null =>
  orNull(() => {
    const profile = readProfileRow(db);
    if (!profile) return null;
    const today = localToday(profile.timeZone);
    const monday = weekStart(today);

    // Зависшую с прошлых дней сервер закроет при следующем обращении — на экране она уже не «идёт»
    const current =
      db
        .select()
        .from(workouts)
        .where(and(eq(workouts.status, 'IN_PROGRESS'), gte(workouts.date, today)))
        .orderBy(desc(workouts.startedAt))
        .get() ?? null;
    const finishedToday = db
      .select()
      .from(workouts)
      .where(and(eq(workouts.date, today), inArray(workouts.status, [...FINISHED])))
      .orderBy(desc(workouts.startedAt))
      .all();
    const day = db.select().from(planDays).where(eq(planDays.date, today)).get() ?? null;
    const pause = activePauseOf(db.select().from(pauses).all(), today);
    const weekDays = db
      .select()
      .from(planDays)
      .where(and(gte(planDays.date, monday), lt(planDays.date, addDays(monday, 7))))
      .all();
    const aheadDays = db
      .select({ date: planDays.date, status: planDays.status })
      .from(planDays)
      .where(and(gt(planDays.date, today), lte(planDays.date, addDays(today, NEXT_HORIZON_DAYS))))
      .all();
    const weekWorkouts = db
      .select({ date: workouts.date })
      .from(workouts)
      .where(
        and(gte(workouts.date, monday), lt(workouts.date, addDays(monday, 7)), inArray(workouts.status, [...FINISHED])),
      )
      .all();

    const program = profile.activeProgramClientId
      ? db.select().from(programs).where(eq(programs.clientId, profile.activeProgramClientId)).get()
      : undefined;
    const complexes = program ? complexesOf(db, program.clientId) : [];
    const next = nextComplexOf(complexes, profile.nextComplexClientId);

    const state = stateOf({
      onboarded: !!profile.onboardedAt,
      current: !!current,
      finished: finishedToday.length > 0 || day?.status === 'DONE',
      paused: !!pause,
      day,
      hasProgram: complexes.length > 0,
      isTrainingDay: profile.trainingDays.includes(weekdayOf(today)),
    });

    const complexView = (): DayComplexResponseDto | null => {
      const clientId = complexOfDay({
        suggested: day?.suggestedComplexClientId ?? null,
        next: next?.clientId ?? null,
        allowed: complexes.map((c) => c.clientId),
      });
      const complex = complexes.find((c) => c.clientId === clientId);
      if (!complex) return null;
      const lookup = exerciseLookup(
        db,
        complex.items.map((i) => i.exerciseId),
      );
      const zones = limitedZonesOf(db, today);
      return {
        id: uiIdOf(complex),
        name: complex.name,
        byQueue: complex.clientId === next?.clientId,
        cardioName: complex.cardioName,
        cardioMinutes: complex.cardioMinutes,
        warmupMinutes: resolveWarmup(complex, profile),
        exercises: complex.items.map((item) => {
          const exercise = lookup.get(item.exerciseId);
          return {
            id: uiIdOf(item),
            exerciseId: item.exerciseId,
            name: exercise.name,
            muscles: lookup.primaryMuscles(exercise),
            sets: item.sets,
            repsMin: item.repsMin,
            repsMax: item.repsMax,
            measure: exercise.measure,
            superset: item.superset,
            limitedZones: zones(exercise.jointIds),
          };
        }),
      };
    };

    const finishedWorkout = (): DayWorkoutResponseDto | null => {
      const workout =
        finishedToday[0] ??
        (day?.workoutClientId
          ? db.select().from(workouts).where(eq(workouts.clientId, day.workoutClientId)).get()
          : undefined);
      return workout ? briefOf(db, workout) : null;
    };

    return {
      state,
      date: today,
      dayId: day ? uiIdOf(day) : null,
      streak: { current: profile.currentStreak, best: profile.bestStreak },
      week: weekOf(
        profile,
        today,
        weekDays,
        weekWorkouts.map((w) => w.date),
        pause,
      ),
      programName: program?.name ?? null,
      complexes: complexes.map((c) => ({
        id: uiIdOf(c),
        name: c.name,
        exerciseCount: c.items.length,
        isNext: c.clientId === next?.clientId,
      })),
      complex: state === 'TRAINING' || state === 'REST' ? complexView() : null,
      workout:
        state === 'IN_PROGRESS' && current ? briefOf(db, current) : state === 'DONE' ? finishedWorkout() : null,
      workoutsToday: finishedToday.length,
      next:
        next && NEXT_STATES.includes(state)
          ? {
              date: nextTrainingDate(profile, today, aheadDays, pause),
              complexId: uiIdOf(next),
              complexName: next.name,
              exerciseCount: next.items.length,
            }
          : null,
      pause: pause && { endDate: pause.endDate, expired: !!pause.endDate && pause.endDate < today },
      rescheduleOffered: day?.status === 'MISSED' && !!day.rescheduleOfferedAt,
      eveningAsked: day?.status === 'PENDING' && !!day.eveningAskedAt && !day.eveningAnswer,
    };
  });
