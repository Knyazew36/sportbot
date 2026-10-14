import { ApiProperty } from '@nestjs/swagger';

import { SharedWorkoutExerciseResponseDto } from './shared-workout-exercise.response.dto';

export class SharedWorkoutResponseDto {
  @ApiProperty()
  authorName: string;

  @ApiProperty({ description: 'Результат смотрит его автор' })
  isOwn: boolean;

  @ApiProperty()
  workoutId: number;

  @ApiProperty()
  complexName: string;

  @ApiProperty({ example: '2026-10-14' })
  date: string;

  @ApiProperty({ description: 'Длительность, мин' })
  minutes: number;

  @ApiProperty()
  exercisesDone: number;

  @ApiProperty()
  exercisesTotal: number;

  @ApiProperty()
  sets: number;

  @ApiProperty({ description: 'Поднято за тренировку, кг (вес × повторы)' })
  tonnage: number;

  @ApiProperty({ description: 'Текущая серия автора' })
  currentStreak: number;

  @ApiProperty({ type: String, nullable: true })
  cardioName: string | null;

  @ApiProperty({ type: Number, nullable: true })
  cardioMinutes: number | null;

  @ApiProperty({ type: [SharedWorkoutExerciseResponseDto] })
  exercises: SharedWorkoutExerciseResponseDto[];
}
