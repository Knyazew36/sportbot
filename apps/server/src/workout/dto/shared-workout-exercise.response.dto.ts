import { ApiProperty } from '@nestjs/swagger';

import { SharedWorkoutSetResponseDto } from './shared-workout-set.response.dto';

export class SharedWorkoutExerciseResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Сделано: записан подход или нажато «Готово»' })
  done: boolean;

  @ApiProperty({ type: [SharedWorkoutSetResponseDto] })
  sets: SharedWorkoutSetResponseDto[];

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Номер суперсета: участники идут подряд и делаются по кругу',
  })
  superset: number | null;
}
