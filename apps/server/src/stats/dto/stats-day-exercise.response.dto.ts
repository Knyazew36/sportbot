import { ApiProperty } from '@nestjs/swagger';

import { StatsDaySetResponseDto } from './stats-day-set.response.dto';

export class StatsDayExerciseResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  done: boolean;

  @ApiProperty({ type: [StatsDaySetResponseDto] })
  sets: StatsDaySetResponseDto[];
}
