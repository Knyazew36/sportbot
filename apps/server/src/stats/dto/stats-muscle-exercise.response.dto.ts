import { ApiProperty } from '@nestjs/swagger';

import { StatsPointResponseDto } from './stats-point.response.dto';

/** Упражнение на мышцу: лучший вес подхода по тренировкам. */
export class StatsMuscleExerciseResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Лучший вес первой тренировки на графике, кг' })
  first: number;

  @ApiProperty({ description: 'Лучший вес последней тренировки, кг' })
  last: number;

  @ApiProperty({ description: 'Максимум за весь график, кг' })
  best: number;

  @ApiProperty({ type: [StatsPointResponseDto] })
  points: StatsPointResponseDto[];
}
