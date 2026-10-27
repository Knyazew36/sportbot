/**
 * Курсор pull отстаёт от времени запроса: строка, чья транзакция началась раньше,
 * а закоммитилась позже чтения, не потеряется — придёт следующим pull повторно.
 */
export const PULL_OVERLAP_MS = 60_000;

/** Сколько живут надгробия и журнал операций. Курсор старше — клиенту отдаётся полный снимок. */
export const SYNC_RETENTION_DAYS = 60;
export const SYNC_RETENTION_MS = SYNC_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** Таблицы с надгробиями — имена как в триггере sync_tombstone. */
export const SYNC_ENTITIES = [
  'Program',
  'Complex',
  'ComplexExercise',
  'PlanDay',
  'Workout',
  'WorkoutExercise',
  'WorkoutSet',
  'WorkoutStretch',
  'Pause',
  'Limitation',
  'StretchExclusion',
  'BodyWeight',
] as const;
