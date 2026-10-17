import type {
  CooldownResponseDto,
  CreateWorkoutSetDto,
  SharedWorkoutResponseDto,
  WorkoutAnalogResponseDto,
  WorkoutResponseDto,
  WorkoutSetResponseDto,
  WorkoutSummaryResponseDto,
} from '@/shared/api/generated/model'

export type WorkoutSet = WorkoutSetResponseDto & {
  /** Подход из офлайн-очереди: ещё не дошёл до сервера (id = 0) или его правка ещё не дошла */
  pending?: boolean
}
export type WorkoutItem = Omit<WorkoutResponseDto['exercises'][number], 'sets'> & { sets: WorkoutSet[] }
export type Workout = Omit<WorkoutResponseDto, 'exercises'> & { exercises: WorkoutItem[] }
export type WorkoutAnalog = WorkoutAnalogResponseDto
export type WorkoutSummary = WorkoutSummaryResponseDto
export type Cooldown = CooldownResponseDto
export type SharedWorkout = SharedWorkoutResponseDto
export type CooldownStretch = Cooldown['main'][number]

/** Время подхода с клиента: подход доезжает через офлайн-очередь позже нажатия */
export type SetTiming = Pick<CreateWorkoutSetDto, 'doneAt' | 'workSeconds' | 'restTargetSeconds'>

export type CurrentWorkout = { workout: Workout | null }

export const workoutKeys = {
  current: ['workout', 'current'] as const,
  analogs: (itemId: number) => ['workout', 'analogs', itemId] as const,
  detail: (id: number) => ['workout', 'detail', id] as const,
  summary: (id: number) => ['workout', 'summary', id] as const,
  cooldown: (id: number) => ['workout', 'cooldown', id] as const,
  shared: (token: string) => ['workout', 'shared', token] as const,
}
