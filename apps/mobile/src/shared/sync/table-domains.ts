// Какие экраны читают таблицу: домен — первый сегмент ключа useLocalQuery после источника ('workout', 'day', …).
// Связи с запасом: лишнее перечитывание дешевле экрана со старыми данными

const WORKOUT = ['workout', 'day', 'stats', 'program'];
const PLAN = ['day', 'stats', 'workout'];
const PROGRAM = ['program', 'day', 'workout'];
const PROFILE = ['profile', 'day', 'stats', 'workout', 'program', 'onboarding'];
const CATALOG = ['catalog', 'program', 'day', 'workout', 'stats', 'profile', 'limitation', 'stretch-exclusion'];

export const TABLE_DOMAINS: Record<string, string[]> = {
  workouts: WORKOUT,
  workout_exercises: WORKOUT,
  workout_sets: WORKOUT,
  workout_stretches: WORKOUT,
  plan_days: PLAN,
  pauses: PLAN,
  programs: PROGRAM,
  complexes: PROGRAM,
  complex_exercises: PROGRAM,
  profile: PROFILE,
  limitations: ['limitation', ...PROFILE],
  stretch_exclusions: ['stretch-exclusion', ...PROFILE],
  body_weights: ['profile', 'stats'],
  muscles: CATALOG,
  joints: CATALOG,
  tag_groups: CATALOG,
  tags: CATALOG,
  exercises: CATALOG,
  stretches: CATALOG,
  templates: ['onboarding'],
  outbox: ['outbox'],
};

/** Служебное: экраны его не читают (время синка — через useLiveQuery, он подписан сам) */
export const SILENT_TABLES = new Set(['meta']);
