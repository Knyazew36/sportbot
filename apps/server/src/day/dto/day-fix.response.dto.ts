import { ApiProperty } from '@nestjs/swagger';

export class DayFixResponseDto {
  @ApiProperty({ description: 'Серия после исправления' })
  currentStreak: number;
}
