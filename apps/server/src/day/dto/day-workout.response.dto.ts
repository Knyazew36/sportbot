import { ApiProperty } from '@nestjs/swagger';

export class DayWorkoutResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  complexName: string;

  @ApiProperty({ description: 'Сделано упражнений' })
  done: number;

  @ApiProperty({ description: 'Всего упражнений' })
  total: number;
}
