import { ApiProperty } from '@nestjs/swagger';

export class StatsDaySetResponseDto {
  @ApiProperty({ description: 'Вес, кг; 0 — без веса' })
  weight: number;

  @ApiProperty()
  reps: number;
}
