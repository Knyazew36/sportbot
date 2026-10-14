import { ApiProperty } from '@nestjs/swagger';

import { WorkoutResponseDto } from './workout.response.dto';

export class WorkoutCurrentResponseDto {
  @ApiProperty({
    type: WorkoutResponseDto,
    nullable: true,
    description: 'Незавершённая тренировка; null — сейчас тренировки нет',
  })
  workout: WorkoutResponseDto | null;
}
