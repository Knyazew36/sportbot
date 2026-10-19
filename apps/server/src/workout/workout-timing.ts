import type { WorkoutFull } from './workout.service';

export interface WorkoutTiming {
  warmupSeconds: number;
  workSeconds: number;
  restSeconds: number;
  restCount: number;
  restTargetSeconds: number;
  restPlannedActualSeconds: number;
  tailSeconds: number;
  cooldownSeconds: number | null;
  /** Фактический отдых перед подходом по id подхода; нет ключа — не отдых. */
  restBefore: Map<number, number>;
}

const seconds = (from: Date, to: Date): number =>
  Math.max(0, Math.round((to.getTime() - from.getTime()) / 1000));

/**
 * Разбивка времени тренировки по шкале подходов: событий не храним, отдых выводим из разрывов между `doneAt`.
 * С первого подхода человек либо делает подход, либо отдыхает — третьего не бывает: ввод веса,
 * переход к другому упражнению и долгая пауза тоже отдых. null — подходов со временем нет (старые, SIMPLE).
 */
export function workoutTiming(workout: WorkoutFull): WorkoutTiming | null {
  const sets = workout.exercises
    .flatMap((item) =>
      item.sets.map((set) => ({
        ...set,
        // Круг суперсета — один блок: его участники записаны одним моментом
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
    tailSeconds: 0,
    cooldownSeconds: null,
    restBefore: new Map(),
  };

  // Всё до первого подхода — разминка: отмеченная на экране разминки и сборы после неё
  let prevEnd = workout.startedAt;
  sets.forEach((set, index) => {
    const prev = index ? sets[index - 1] : null;
    // Остальные участники круга записаны тем же моментом: отдыха перед ними нет, иначе нули тянут вниз средний
    if (
      prev &&
      prev.group === set.group &&
      +prev.doneAt === +set.doneAt &&
      set.workSeconds === null
    )
      return;
    // Начала подхода без секундомера не знаем: весь разрыв до записи идёт в отдых, работа — ноль
    const start =
      set.workSeconds === null
        ? set.doneAt
        : new Date(set.doneAt.getTime() - set.workSeconds * 1000);
    const gap = seconds(prevEnd, start);
    timing.workSeconds += set.workSeconds ?? 0;
    if (!index) timing.warmupSeconds = gap;
    else {
      timing.restSeconds += gap;
      timing.restCount += 1;
      // Отдых перед ручным подходом включает и сам подход — у подхода его не показываем
      if (set.workSeconds !== null) timing.restBefore.set(set.id, gap);
      if (set.restTargetSeconds !== null) {
        timing.restTargetSeconds += set.restTargetSeconds;
        timing.restPlannedActualSeconds += gap;
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
