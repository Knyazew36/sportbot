import { ApiProperty } from '@nestjs/swagger';

import { WorkoutRecordResponseDto } from './workout-record.response.dto';

export class WorkoutSummaryResponseDto {
  @ApiProperty()
  workoutId: number;

  @ApiProperty()
  complexName: string;

  @ApiProperty({ enum: ['IN_PROGRESS', 'FINISHED', 'AUTO_CLOSED'] })
  status: 'IN_PROGRESS' | 'FINISHED' | 'AUTO_CLOSED';

  @ApiProperty({ description: 'Длительность, мин' })
  minutes: number;

  @ApiProperty({ description: 'Сделано упражнений' })
  exercisesDone: number;

  @ApiProperty()
  exercisesTotal: number;

  @ApiProperty({ description: 'Записано подходов' })
  sets: number;

  @ApiProperty({ description: 'Поднято за тренировку, кг (вес × повторы)' })
  tonnage: number;

  @ApiProperty()
  currentStreak: number;

  @ApiProperty({ type: String, nullable: true })
  cardioName: string | null;

  @ApiProperty({ type: Number, nullable: true })
  cardioMinutes: number | null;

  @ApiProperty({
    type: [WorkoutRecordResponseDto],
    description: 'Личные рекорды этой тренировки',
  })
  records: WorkoutRecordResponseDto[];
}
