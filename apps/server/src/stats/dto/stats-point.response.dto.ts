import { ApiProperty } from '@nestjs/swagger';

/** Точка графика: дата и значение (лучший вес тренировки или вес тела). */
export class StatsPointResponseDto {
  @ApiProperty({ example: '2026-10-13' })
  date: string;

  @ApiProperty()
  value: number;
}
