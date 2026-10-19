import { ApiProperty } from '@nestjs/swagger';

import { DayExerciseResponseDto } from './day-exercise.response.dto';

export class DayComplexResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Предложен по очереди, а не выбран вручную' })
  byQueue: boolean;

  @ApiProperty({ type: String, nullable: true })
  cardioName: string | null;

  @ApiProperty({ type: Number, nullable: true })
  cardioMinutes: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Разминка с учётом профиля, мин; null — без разминки',
  })
  warmupMinutes: number | null;

  @ApiProperty({ type: [DayExerciseResponseDto] })
  exercises: DayExerciseResponseDto[];
}
