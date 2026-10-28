import { ApiProperty } from '@nestjs/swagger';

import {
  CooldownBlock,
  Gender,
  PauseOrigin,
  PlanDayStatus,
  PlanDayType,
  PollAnswer,
  ProgramPublication,
  TrackingMode,
  WeightAskFrequency,
  WorkoutStatus,
} from '@/generated/prisma/client';
import { ProgramTagResponseDto } from '@/program-tag/dto/program-tag.response.dto';

/**
 * Строки данных пользователя для локальной базы мобилки. У каждой строки есть
 * серверный id и clientId; ссылки на родителя — обоими, чтобы клиент связал строки
 * и до, и после получения серверных id. Даты дня — 'YYYY-MM-DD', время — ISO.
 */

const nullableInt = { type: Number, nullable: true } as const;
const nullableStr = { type: String, nullable: true } as const;
const nullableTime = {
  type: String,
  format: 'date-time',
  nullable: true,
} as const;
const time = { type: String, format: 'date-time' } as const;
const day = { type: String, example: '2026-10-27' } as const;

export class SyncProfileRowDto {
  @ApiProperty()
  displayName: string;

  @ApiProperty({ example: 'Europe/Moscow' })
  timeZone: string;

  @ApiProperty({ ...nullableStr, description: 'Фото профиля; null — инициалы' })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Город или UTC±N' })
  timeZoneTitle: string;

  @ApiProperty({ enum: Gender, enumName: 'Gender', nullable: true })
  gender: Gender | null;

  @ApiProperty({ type: [Number], description: '0..6, 0 — воскресенье' })
  trainingDays: number[];

  @ApiProperty({ example: '08:00' })
  morningTime: string;

  @ApiProperty({ example: '20:00' })
  eveningTime: string;

  @ApiProperty()
  remindersEnabled: boolean;

  @ApiProperty()
  questionsEnabled: boolean;

  @ApiProperty({ enum: WeightAskFrequency, enumName: 'WeightAskFrequency' })
  weightAskFrequency: WeightAskFrequency;

  @ApiProperty(nullableInt)
  activeProgramId: number | null;

  @ApiProperty(nullableStr)
  activeProgramClientId: string | null;

  @ApiProperty({ ...nullableInt, description: 'Указатель ротации' })
  nextComplexId: number | null;

  @ApiProperty(nullableStr)
  nextComplexClientId: string | null;

  @ApiProperty()
  onboardingStep: number;

  @ApiProperty(nullableTime)
  onboardedAt: string | null;

  @ApiProperty()
  currentStreak: number;

  @ApiProperty()
  bestStreak: number;

  @ApiProperty()
  missedInRow: number;

  @ApiProperty()
  showRestTimer: boolean;

  @ApiProperty()
  restSeconds: number;

  @ApiProperty()
  restAutoStart: boolean;

  @ApiProperty()
  timerSound: boolean;

  @ApiProperty()
  timerVibration: boolean;

  @ApiProperty()
  warmupMinutes: number;

  @ApiProperty({ ...time, description: 'Когда заведён профиль — баланс мышц новичка' })
  createdAt: string;

  @ApiProperty(time)
  updatedAt: string;
}

export class SyncProgramRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ ...nullableInt, description: 'С какой программы снята копия' })
  sourceProgramId: number | null;

  @ApiProperty(nullableTime)
  sourceSyncedAt: string | null;

  @ApiProperty(nullableTime)
  sourceDismissedAt: string | null;

  @ApiProperty(time)
  contentUpdatedAt: string;

  @ApiProperty({ enum: ProgramPublication, enumName: 'ProgramPublication' })
  publication: ProgramPublication;

  @ApiProperty(nullableStr)
  description: string | null;

  @ApiProperty({ ...nullableStr, description: 'Имя друга, с чьей программы снята копия' })
  fromFriend: string | null;

  @ApiProperty({ description: 'Копия шаблона' })
  fromTemplate: boolean;

  @ApiProperty({ description: 'Источник копии поменялся после копирования' })
  sourceUpdated: boolean;

  @ApiProperty()
  isPublished: boolean;

  @ApiProperty({ description: 'Сколько раз программу взяли себе' })
  addedCount: number;

  @ApiProperty({ description: 'Текст публикации ждёт проверки' })
  textPending: boolean;

  @ApiProperty(nullableStr)
  rejectReason: string | null;

  @ApiProperty({ type: [ProgramTagResponseDto] })
  tags: ProgramTagResponseDto[];

  @ApiProperty(time)
  createdAt: string;

  @ApiProperty(time)
  updatedAt: string;
}

export class SyncComplexRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  programId: number;

  @ApiProperty()
  programClientId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Порядок в ротации' })
  position: number;

  @ApiProperty(nullableStr)
  cardioName: string | null;

  @ApiProperty(nullableInt)
  cardioMinutes: number | null;

  @ApiProperty({
    ...nullableInt,
    description: 'Разминка, мин; null — как в профиле',
  })
  warmupMinutes: number | null;

  @ApiProperty(time)
  updatedAt: string;
}

export class SyncComplexExerciseRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  complexId: number;

  @ApiProperty()
  complexClientId: string;

  @ApiProperty()
  exerciseId: number;

  @ApiProperty()
  position: number;

  @ApiProperty()
  sets: number;

  @ApiProperty()
  repsMin: number;

  @ApiProperty()
  repsMax: number;

  @ApiProperty(nullableInt)
  superset: number | null;

  @ApiProperty(time)
  updatedAt: string;
}

export class SyncPlanDayRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientId: string;

  @ApiProperty(day)
  date: string;

  @ApiProperty({ enum: PlanDayType, enumName: 'PlanDayType' })
  type: PlanDayType;

  @ApiProperty({ enum: PlanDayStatus, enumName: 'PlanDayStatus' })
  status: PlanDayStatus;

  @ApiProperty({ enum: PollAnswer, enumName: 'PollAnswer', nullable: true })
  morningAnswer: PollAnswer | null;

  @ApiProperty({ enum: PollAnswer, enumName: 'PollAnswer', nullable: true })
  eveningAnswer: PollAnswer | null;

  @ApiProperty(nullableInt)
  suggestedComplexId: number | null;

  @ApiProperty(nullableStr)
  suggestedComplexClientId: string | null;

  @ApiProperty(nullableInt)
  workoutId: number | null;

  @ApiProperty(nullableStr)
  workoutClientId: string | null;

  @ApiProperty({ ...nullableTime, description: 'Бот предложил «напомнить завтра?»' })
  rescheduleOfferedAt: string | null;

  @ApiProperty({ ...nullableTime, description: 'Бот задал вечерний вопрос' })
  eveningAskedAt: string | null;

  @ApiProperty(time)
  updatedAt: string;
}

export class SyncWorkoutRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientId: string;

  @ApiProperty(nullableInt)
  complexId: number | null;

  @ApiProperty(nullableStr)
  complexClientId: string | null;

  @ApiProperty({ description: 'Снимок названия комплекса' })
  complexName: string;

  @ApiProperty(nullableStr)
  cardioName: string | null;

  @ApiProperty(nullableInt)
  cardioMinutes: number | null;

  @ApiProperty(day)
  date: string;

  @ApiProperty({ enum: TrackingMode, enumName: 'TrackingMode' })
  mode: TrackingMode;

  @ApiProperty({ enum: WorkoutStatus, enumName: 'WorkoutStatus' })
  status: WorkoutStatus;

  @ApiProperty()
  unplanned: boolean;

  @ApiProperty(time)
  startedAt: string;

  @ApiProperty(nullableTime)
  finishedAt: string | null;

  @ApiProperty(nullableInt)
  warmupMinutes: number | null;

  @ApiProperty(nullableTime)
  warmupFinishedAt: string | null;

  @ApiProperty(nullableTime)
  cooldownStartedAt: string | null;

  @ApiProperty(nullableTime)
  cooldownFinishedAt: string | null;

  @ApiProperty(time)
  updatedAt: string;
}

export class SyncWorkoutExerciseRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  workoutId: number;

  @ApiProperty()
  workoutClientId: string;

  @ApiProperty()
  exerciseId: number;

  @ApiProperty()
  position: number;

  @ApiProperty()
  done: boolean;

  @ApiProperty()
  plannedSets: number;

  @ApiProperty()
  repsMin: number;

  @ApiProperty()
  repsMax: number;

  @ApiProperty(nullableInt)
  superset: number | null;

  @ApiProperty({ ...nullableInt, description: 'Вместо какого упражнения' })
  replacedExerciseId: number | null;

  @ApiProperty(time)
  updatedAt: string;
}

export class SyncWorkoutSetRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  workoutExerciseId: number;

  @ApiProperty()
  workoutExerciseClientId: string;

  @ApiProperty()
  number: number;

  @ApiProperty({ description: 'кг; 0 — без веса' })
  weight: number;

  @ApiProperty()
  reps: number;

  @ApiProperty(nullableTime)
  doneAt: string | null;

  @ApiProperty(nullableInt)
  workSeconds: number | null;

  @ApiProperty(nullableInt)
  restTargetSeconds: number | null;

  @ApiProperty(time)
  updatedAt: string;
}

export class SyncWorkoutStretchRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  workoutId: number;

  @ApiProperty()
  workoutClientId: string;

  @ApiProperty()
  stretchId: number;

  @ApiProperty({ enum: CooldownBlock, enumName: 'CooldownBlock' })
  block: CooldownBlock;

  @ApiProperty()
  position: number;

  @ApiProperty(time)
  updatedAt: string;
}

export class SyncPauseRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientId: string;

  @ApiProperty(day)
  startDate: string;

  @ApiProperty({ ...day, nullable: true, description: 'null — до отмены' })
  endDate: string | null;

  @ApiProperty({ enum: PauseOrigin, enumName: 'PauseOrigin' })
  origin: PauseOrigin;

  @ApiProperty({ ...nullableTime, description: 'null — действует' })
  endedAt: string | null;

  @ApiProperty(time)
  updatedAt: string;
}

export class SyncLimitationRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  jointId: number;

  @ApiProperty(day)
  startDate: string;

  @ApiProperty({ ...day, nullable: true })
  endDate: string | null;

  @ApiProperty(nullableTime)
  cancelledAt: string | null;

  @ApiProperty(time)
  updatedAt: string;
}

export class SyncStretchExclusionRowDto {
  @ApiProperty()
  clientId: string;

  @ApiProperty()
  stretchId: number;

  @ApiProperty(time)
  updatedAt: string;
}

export class SyncBodyWeightRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  clientId: string;

  @ApiProperty(day)
  date: string;

  @ApiProperty({ description: 'кг' })
  value: number;

  @ApiProperty(time)
  updatedAt: string;
}

export class SyncDeletedRowDto {
  @ApiProperty({
    description: 'Таблица: Program, Complex, Workout, WorkoutSet, …',
  })
  entity: string;

  @ApiProperty()
  clientId: string;
}
