import { ApiProperty } from '@nestjs/swagger';

export class StatsAttendanceWeekResponseDto {
  @ApiProperty({ example: '2026-10-12', description: 'Понедельник недели' })
  weekStart: string;

  @ApiProperty()
  done: number;

  @ApiProperty()
  planned: number;

  @ApiProperty()
  percent: number;
}
