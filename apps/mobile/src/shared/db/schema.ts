import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type {
  CooldownBlock,
  Equipment,
  ExerciseMeasure,
  Gender,
  ImageCreditResponseDto,
  MuscleRole,
  PauseOrigin,
  PlanDayStatus,
  PlanDayType,
  PollAnswer,
  ProgramPublication,
  ProgramTagResponseDto,
  StretchKind,
  StretchPosition,
  SyncTemplateComplexDto,
  TrackingMode,
  WeightAskFrequency,
  WorkoutStatus,
} from '@sportbot/api/generated/model';

// Зеркало строк GET sync/pull и sync/catalog. Ключ данных пользователя — clientId (uuid):
// строка, созданная офлайн, живёт без серверного id, пока push её не доставит.
// Связи — по clientId родителя; внешних ключей нет: удаления каскадит движок синка сам,
// а порядок строк в pull не гарантирует, что родитель придёт раньше ребёнка.
// Даты дней — 'YYYY-MM-DD', моменты — ISO-строки, как в ответе сервера

const json = <T>(name: string) => text(name, { mode: 'json' }).$type<T>();
const bool = (name: string) => integer(name, { mode: 'boolean' });

// ── Пользователь ────────────────────────────────────────────────────────────

/** Одна строка (id = 1): профиль спортбота */
export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey(),
  displayName: text('displayName').notNull(),
  avatarUrl: text('avatarUrl'),
  timeZone: text('timeZone').notNull(),
  timeZoneTitle: text('timeZoneTitle').notNull().default(''),
  gender: text('gender').$type<Gender>(),
  trainingDays: json<number[]>('trainingDays').notNull(),
  morningTime: text('morningTime').notNull(),
  eveningTime: text('eveningTime').notNull(),
  remindersEnabled: bool('remindersEnabled').notNull(),
  questionsEnabled: bool('questionsEnabled').notNull(),
  weightAskFrequency: text('weightAskFrequency').$type<WeightAskFrequency>().notNull(),
  activeProgramId: integer('activeProgramId'),
  activeProgramClientId: text('activeProgramClientId'),
  nextComplexId: integer('nextComplexId'),
  nextComplexClientId: text('nextComplexClientId'),
  onboardingStep: integer('onboardingStep').notNull(),
  onboardedAt: text('onboardedAt'),
  currentStreak: integer('currentStreak').notNull(),
  bestStreak: integer('bestStreak').notNull(),
  missedInRow: integer('missedInRow').notNull(),
  showRestTimer: bool('showRestTimer').notNull(),
  restSeconds: integer('restSeconds').notNull(),
  restAutoStart: bool('restAutoStart').notNull(),
  timerSound: bool('timerSound').notNull(),
  timerVibration: bool('timerVibration').notNull(),
  warmupMinutes: integer('warmupMinutes').notNull(),
  /** Когда заведён профиль: баланс мышц новичка считается не дольше его возраста */
  createdAt: text('createdAt').notNull().default(''),
  updatedAt: text('updatedAt').notNull(),
});

export const programs = sqliteTable('programs', {
  clientId: text('clientId').primaryKey(),
  id: integer('id'),
    localId: integer('localId'),
  name: text('name').notNull(),
  sourceProgramId: integer('sourceProgramId'),
  sourceSyncedAt: text('sourceSyncedAt'),
  sourceDismissedAt: text('sourceDismissedAt'),
  contentUpdatedAt: text('contentUpdatedAt').notNull(),
  publication: text('publication').$type<ProgramPublication>().notNull(),
  // Как показывать программу: считает сервер, приходят готовыми вместе со строкой
  description: text('description'),
  fromFriend: text('fromFriend'),
  fromTemplate: bool('fromTemplate').notNull().default(false),
  sourceUpdated: bool('sourceUpdated').notNull().default(false),
  isPublished: bool('isPublished').notNull().default(false),
  addedCount: integer('addedCount').notNull().default(0),
  textPending: bool('textPending').notNull().default(false),
  rejectReason: text('rejectReason'),
  tags: json<ProgramTagResponseDto[]>('tags').notNull().default([]),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const complexes = sqliteTable(
  'complexes',
  {
    clientId: text('clientId').primaryKey(),
    id: integer('id'),
    localId: integer('localId'),
    programClientId: text('programClientId').notNull(),
    name: text('name').notNull(),
    position: integer('position').notNull(),
    cardioName: text('cardioName'),
    cardioMinutes: integer('cardioMinutes'),
    warmupMinutes: integer('warmupMinutes'),
    updatedAt: text('updatedAt').notNull(),
  },
  (t) => [index('complexes_program').on(t.programClientId)],
);

export const complexExercises = sqliteTable(
  'complex_exercises',
  {
    clientId: text('clientId').primaryKey(),
    id: integer('id'),
    localId: integer('localId'),
    complexClientId: text('complexClientId').notNull(),
    exerciseId: integer('exerciseId').notNull(),
    position: integer('position').notNull(),
    sets: integer('sets').notNull(),
    repsMin: integer('repsMin').notNull(),
    repsMax: integer('repsMax').notNull(),
    superset: integer('superset'),
    updatedAt: text('updatedAt').notNull(),
  },
  (t) => [index('complex_exercises_complex').on(t.complexClientId)],
);

export const planDays = sqliteTable(
  'plan_days',
  {
    clientId: text('clientId').primaryKey(),
    id: integer('id'),
    localId: integer('localId'),
    date: text('date').notNull(),
    type: text('type').$type<PlanDayType>().notNull(),
    status: text('status').$type<PlanDayStatus>().notNull(),
    morningAnswer: text('morningAnswer').$type<PollAnswer>(),
    eveningAnswer: text('eveningAnswer').$type<PollAnswer>(),
    suggestedComplexClientId: text('suggestedComplexClientId'),
    workoutClientId: text('workoutClientId'),
    rescheduleOfferedAt: text('rescheduleOfferedAt'),
    eveningAskedAt: text('eveningAskedAt'),
    updatedAt: text('updatedAt').notNull(),
  },
  (t) => [index('plan_days_date').on(t.date)],
);

// ── Тренировки ──────────────────────────────────────────────────────────────

export const workouts = sqliteTable(
  'workouts',
  {
    clientId: text('clientId').primaryKey(),
    id: integer('id'),
    /** Создана на телефоне: отрицательный id экрана, живёт и после получения серверного */
    localId: integer('localId'),
    complexClientId: text('complexClientId'),
    complexName: text('complexName').notNull(),
    cardioName: text('cardioName'),
    cardioMinutes: integer('cardioMinutes'),
    date: text('date').notNull(),
    mode: text('mode').$type<TrackingMode>().notNull(),
    status: text('status').$type<WorkoutStatus>().notNull(),
    unplanned: bool('unplanned').notNull(),
    startedAt: text('startedAt').notNull(),
    finishedAt: text('finishedAt'),
    warmupMinutes: integer('warmupMinutes'),
    warmupFinishedAt: text('warmupFinishedAt'),
    cooldownStartedAt: text('cooldownStartedAt'),
    cooldownFinishedAt: text('cooldownFinishedAt'),
    updatedAt: text('updatedAt').notNull(),
  },
  (t) => [index('workouts_date').on(t.date)],
);

export const workoutExercises = sqliteTable(
  'workout_exercises',
  {
    clientId: text('clientId').primaryKey(),
    id: integer('id'),
    /** Создана на телефоне: отрицательный id экрана, живёт и после получения серверного */
    localId: integer('localId'),
    workoutClientId: text('workoutClientId').notNull(),
    exerciseId: integer('exerciseId').notNull(),
    position: integer('position').notNull(),
    done: bool('done').notNull(),
    plannedSets: integer('plannedSets').notNull(),
    repsMin: integer('repsMin').notNull(),
    repsMax: integer('repsMax').notNull(),
    superset: integer('superset'),
    replacedExerciseId: integer('replacedExerciseId'),
    updatedAt: text('updatedAt').notNull(),
  },
  (t) => [index('workout_exercises_workout').on(t.workoutClientId)],
);

export const workoutSets = sqliteTable(
  'workout_sets',
  {
    clientId: text('clientId').primaryKey(),
    id: integer('id'),
    /** Создана на телефоне: отрицательный id экрана, живёт и после получения серверного */
    localId: integer('localId'),
    workoutExerciseClientId: text('workoutExerciseClientId').notNull(),
    number: integer('number').notNull(),
    weight: real('weight').notNull(),
    reps: integer('reps').notNull(),
    doneAt: text('doneAt'),
    workSeconds: integer('workSeconds'),
    restTargetSeconds: integer('restTargetSeconds'),
    updatedAt: text('updatedAt').notNull(),
  },
  (t) => [index('workout_sets_item').on(t.workoutExerciseClientId)],
);

export const workoutStretches = sqliteTable(
  'workout_stretches',
  {
    clientId: text('clientId').primaryKey(),
    id: integer('id'),
    /** Создана на телефоне: отрицательный id экрана, живёт и после получения серверного */
    localId: integer('localId'),
    workoutClientId: text('workoutClientId').notNull(),
    stretchId: integer('stretchId').notNull(),
    block: text('block').$type<CooldownBlock>().notNull(),
    position: integer('position').notNull(),
    updatedAt: text('updatedAt').notNull(),
  },
  (t) => [index('workout_stretches_workout').on(t.workoutClientId)],
);

// ── Режим и тело ────────────────────────────────────────────────────────────

export const pauses = sqliteTable('pauses', {
  clientId: text('clientId').primaryKey(),
  id: integer('id'),
    localId: integer('localId'),
  startDate: text('startDate').notNull(),
  endDate: text('endDate'),
  origin: text('origin').$type<PauseOrigin>().notNull(),
  endedAt: text('endedAt'),
  updatedAt: text('updatedAt').notNull(),
});

export const limitations = sqliteTable('limitations', {
  clientId: text('clientId').primaryKey(),
  id: integer('id'),
  localId: integer('localId'),
  jointId: integer('jointId').notNull(),
  startDate: text('startDate').notNull(),
  endDate: text('endDate'),
  cancelledAt: text('cancelledAt'),
  updatedAt: text('updatedAt').notNull(),
});

export const stretchExclusions = sqliteTable('stretch_exclusions', {
  clientId: text('clientId').primaryKey(),
  stretchId: integer('stretchId').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const bodyWeights = sqliteTable(
  'body_weights',
  {
    clientId: text('clientId').primaryKey(),
    id: integer('id'),
    date: text('date').notNull(),
    value: real('value').notNull(),
    updatedAt: text('updatedAt').notNull(),
  },
  (t) => [index('body_weights_date').on(t.date)],
);

// ── Справочник ──────────────────────────────────────────────────────────────

export const muscles = sqliteTable('muscles', {
  id: integer('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  bodyOrder: integer('bodyOrder').notNull(),
});

export const joints = sqliteTable('joints', {
  id: integer('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
});

export const tagGroups = sqliteTable('tag_groups', {
  id: integer('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  position: integer('position').notNull(),
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  position: integer('position').notNull(),
  groupId: integer('groupId').notNull(),
});

export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  nameNormalized: text('nameNormalized').notNull(),
  technique: text('technique'),
  steps: json<string[]>('steps').notNull(),
  mistakes: json<string[]>('mistakes').notNull(),
  imageUrl: text('imageUrl'),
  imageEndUrl: text('imageEndUrl'),
  imageCredit: json<ImageCreditResponseDto | null>('imageCredit'),
  videoUrl: text('videoUrl'),
  equipment: text('equipment').$type<Equipment>(),
  measure: text('measure').$type<ExerciseMeasure>().notNull(),
  draft: bool('draft').notNull(),
  muscles: json<{ muscleId: number; role: MuscleRole }[]>('muscles').notNull(),
  jointIds: json<number[]>('jointIds').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const stretches = sqliteTable('stretches', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  nameNormalized: text('nameNormalized').notNull(),
  howTo: text('howTo'),
  steps: json<string[]>('steps').notNull(),
  mistakes: json<string[]>('mistakes').notNull(),
  imageUrl: text('imageUrl'),
  imageEndUrl: text('imageEndUrl'),
  imageCredit: json<ImageCreditResponseDto | null>('imageCredit'),
  videoUrl: text('videoUrl'),
  feel: text('feel'),
  position: text('position').$type<StretchPosition>(),
  holdSeconds: integer('holdSeconds').notNull(),
  perSide: bool('perSide').notNull(),
  kind: text('kind').$type<StretchKind>().notNull(),
  draft: bool('draft').notNull(),
  muscleIds: json<number[]>('muscleIds').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

/** Шаблоны программ с составом — онбординг берёт копию без сети. Приходят целиком в каждом синке */
export const templates = sqliteTable('templates', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  position: integer('position').notNull(),
  contentUpdatedAt: text('contentUpdatedAt').notNull(),
  tags: json<ProgramTagResponseDto[]>('tags').notNull(),
  complexes: json<SyncTemplateComplexDto[]>('complexes').notNull(),
});

/** Комплексы растяжек: заминка из них и отдельное занятие идут без сети. Приходят целиком в каждом синке */
export const stretchRoutines = sqliteTable('stretch_routines', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  position: integer('position').notNull(),
  stretchIds: json<number[]>('stretchIds').notNull(),
});

/** Отдельные занятия растяжкой: в статистику тренировок не идут */
export const stretchSessions = sqliteTable(
  'stretch_sessions',
  {
    clientId: text('clientId').primaryKey(),
    id: integer('id'),
    routineId: integer('routineId'),
    routineName: text('routineName').notNull(),
    date: text('date').notNull(),
    startedAt: text('startedAt').notNull(),
    finishedAt: text('finishedAt'),
    updatedAt: text('updatedAt').notNull(),
  },
  (t) => [index('stretch_sessions_startedAt').on(t.startedAt)],
);

// ── Служебное ───────────────────────────────────────────────────────────────

/** Курсоры синка и время последнего успешного обмена: ключ → значение */
export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

/** Неотправленные операции (POST sync/push) — уходят строго по seq */
export const outbox = sqliteTable(
  'outbox',
  {
    opId: text('opId').primaryKey(),
    seq: integer('seq').notNull(),
    type: text('type').notNull(),
    entity: text('entity').notNull(),
    clientId: text('clientId').notNull(),
    payload: json<Record<string, unknown>>('payload').notNull(),
    /** Все clientId, которые операция создаёт или меняет: pull их не перетирает */
    touched: json<string[]>('touched').notNull().default([]),
    at: text('at').notNull(),
    attempts: integer('attempts').notNull().default(0),
  },
  (t) => [index('outbox_seq').on(t.seq), index('outbox_client').on(t.clientId)],
);
