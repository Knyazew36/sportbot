import { ApiProperty } from '@nestjs/swagger';

import type { ProgressUnit } from '../stats.service';
import { StatsPointResponseDto } from './stats-point.response.dto';

/** Упражнение на мышцу: лучший вес подхода по тренировкам, без веса — лучшие повторы. */
export class StatsMuscleExerciseResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: ['kg', 'reps', 'sec', 'min'],
    description:
      'В чём прогресс: kg — лучший вес подхода; reps — упражнение без веса, лучшие повторы',
  })
  unit: ProgressUnit;

  @ApiProperty({
    description: 'Значение первой тренировки на графике (кг или повторы)',
  })
  first: number;

  @ApiProperty({ description: 'Значение последней тренировки' })
  last: number;

  @ApiProperty({ description: 'Максимум за весь график' })
  best: number;

  @ApiProperty({ type: [StatsPointResponseDto] })
  points: StatsPointResponseDto[];
}
