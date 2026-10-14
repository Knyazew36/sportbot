import { ApiProperty } from '@nestjs/swagger';

import { WorkoutLastSetResponseDto } from './workout-last-set.response.dto';

export class WorkoutLastResultResponseDto {
  @ApiProperty({ example: '2026-10-10' })
  date: string;

  @ApiProperty({ type: [WorkoutLastSetResponseDto] })
  sets: WorkoutLastSetResponseDto[];
}
