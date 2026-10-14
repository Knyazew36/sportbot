import { ApiProperty } from '@nestjs/swagger';

import { StatsMuscleExerciseResponseDto } from './stats-muscle-exercise.response.dto';

/** Прогресс весов по мышце: упражнения, где она основная. */
export class StatsMuscleProgressResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [StatsMuscleExerciseResponseDto] })
  exercises: StatsMuscleExerciseResponseDto[];
}
