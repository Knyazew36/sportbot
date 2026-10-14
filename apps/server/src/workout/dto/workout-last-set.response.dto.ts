import { ApiProperty } from '@nestjs/swagger';

export class WorkoutLastSetResponseDto {
  @ApiProperty({ description: 'Вес, кг; 0 — без веса' })
  weight: number;

  @ApiProperty()
  reps: number;
}
