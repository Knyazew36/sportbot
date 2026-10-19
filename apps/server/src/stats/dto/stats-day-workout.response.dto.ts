import { ApiProperty } from '@nestjs/swagger';

import { StatsDayExerciseResponseDto } from './stats-day-exercise.response.dto';

export class StatsDayWorkoutResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  complexName: string;

  @ApiProperty({
    description: 'Начало, ISO: различает несколько тренировок за день',
  })
  startedAt: string;

  @ApiProperty({ description: 'Внеплановая' })
  unplanned: boolean;

  @ApiProperty({
    description: 'Записана без подходов (вечернее «да» или исправление)',
  })
  simple: boolean;

  @ApiProperty({ type: [StatsDayExerciseResponseDto] })
  exercises: StatsDayExerciseResponseDto[];
}
