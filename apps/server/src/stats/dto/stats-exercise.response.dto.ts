import { ApiProperty } from '@nestjs/swagger';

import type { ProgressUnit } from '../stats.service';

export class StatsExerciseResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: ['kg', 'reps'],
    description:
      'В чём прогресс: kg — лучший вес подхода; reps — упражнение без веса, лучшие повторы',
  })
  unit: ProgressUnit;
}
