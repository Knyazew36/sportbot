import { ApiProperty } from '@nestjs/swagger';

import { StatsDaySetResponseDto } from './stats-day-set.response.dto';

export class StatsDayExerciseResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: ['REPS', 'TIME', 'MINUTES'],
    description: 'Чем меряется: TIME — в reps подхода секунды',
  })
  measure: 'REPS' | 'TIME' | 'MINUTES';

  @ApiProperty()
  done: boolean;

  @ApiProperty({ type: [StatsDaySetResponseDto] })
  sets: StatsDaySetResponseDto[];

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Номер суперсета: участники идут подряд и делаются по кругу',
  })
  superset: number | null;
}
