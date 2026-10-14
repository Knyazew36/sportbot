import { ApiProperty } from '@nestjs/swagger';

export class DayStreakResponseDto {
  @ApiProperty({ description: 'Текущая серия' })
  current: number;

  @ApiProperty({ description: 'Рекорд' })
  best: number;
}
