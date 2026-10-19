import type { WorkoutFull } from './workout.service';

/** Разрыв между подходами дольше этого — простой, а не отдых или переход. */
export const IDLE_GAP_SECONDS = 600;

export interface WorkoutTiming {
  warmupSeconds: number;
  workSeconds: number;
  restSeconds: number;
  restCount: number;
  restTargetSeconds: number;
  restPlannedActualSeconds: number;
  transitionSeconds: number;
  idleSeconds: number;
  otherSeconds: number;
  tailSeconds: number;
  cooldownSeconds: number | null;
  /** Фактический отдых перед подходом по id подхода; нет ключа — не отдых. */
  restBefore: Map<number, number>;
}

const seconds = (from: Date, to: Date): number =>
  Math.max(0, Math.round((to.getTime() - from.getTime()) / 1000));

/**
 * Разбивка времени тренировки по шкале подходов: событий не храним, отдых и переходы
 * выводим из разрывов между `doneAt`. null — подходов со временем нет (старые, SIMPLE).
 */
export function workoutTiming(workout: WorkoutFull): WorkoutTiming | null {
  const sets = workout.exercises
    .flatMap((item) =>
      item.sets.map((set) => ({
        ...set,
        // Круг суперсета — один блок: пауза между его участниками это отдых, а не переход
        group:
          item.superset === null ? `e${item.id}` : `s${item.superset}`,
      })),
    )
    .filter((s): s is typeof s & { doneAt: Date } => s.doneAt !== null)
    // Круг суперсета пишется одним моментом: первым идёт подход с временем круга, от него и отдых
    .sort(
      (a, b) =>
        a.doneAt.getTime() - b.doneAt.getTime() ||
        Number(a.workSeconds === null) - Number(b.workSeconds === null),
    );
  if (!sets.length) return null;

  const timing: WorkoutTiming = {
    warmupSeconds: 0,
    workSeconds: 0,
    restSeconds: 0,
    restCount: 0,
    restTargetSeconds: 0,
    restPlannedActualSeconds: 0,
    transitionSeconds: 0,
    idleSeconds: 0,
    otherSeconds: 0,
    tailSeconds: 0,
    cooldownSeconds: null,
    restBefore: new Map(),
  };

  // Разминка — только отмеченная на экране разминки; пауза после неё до первого подхода — переход
  let prevEnd = workout.startedAt;
  const warmupEnd = workout.warmupFinishedAt;
  if (warmupEnd && warmupEnd < sets[0].doneAt) {
    timing.warmupSeconds = seconds(workout.startedAt, warmupEnd);
    prevEnd = warmupEnd;
  }
  sets.forEach((set, index) => {
    const prev = index ? sets[index - 1] : null;
    if (set.workSeconds === null) {
      // Начало подхода неизвестно — разрыв не поделить на отдых и работу
      timing.otherSeconds += seconds(prevEnd, set.doneAt);
    } else {
      timing.workSeconds += set.workSeconds;
      const start = new Date(set.doneAt.getTime() - set.workSeconds * 1000);
      const gap = seconds(prevEnd, start);
      if (gap > IDLE_GAP_SECONDS) timing.idleSeconds += gap;
      else if (!prev || prev.group !== set.group)
        timing.transitionSeconds += gap;
      else {
        timing.restSeconds += gap;
        timing.restCount += 1;
        timing.restBefore.set(set.id, gap);
        if (set.restTargetSeconds !== null) {
          timing.restTargetSeconds += set.restTargetSeconds;
          timing.restPlannedActualSeconds += gap;
        }
      }
    }
    prevEnd = set.doneAt;
  });

  timing.tailSeconds = seconds(prevEnd, workout.finishedAt ?? new Date());
  if (workout.cooldownStartedAt && workout.cooldownFinishedAt)
    timing.cooldownSeconds = seconds(
      workout.cooldownStartedAt,
      workout.cooldownFinishedAt,
    );
  return timing;
}
