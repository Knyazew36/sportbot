import { ApiProperty } from '@nestjs/swagger';

export const WEEK_MARKS = ['DONE', 'MISSED', 'PAUSED', 'PLAN', 'REST'] as const;
export type WeekMark = (typeof WEEK_MARKS)[number];

export class DayWeekCellResponseDto {
  @ApiProperty({ example: '2026-10-13' })
  date: string;

  @ApiProperty({ description: '0..6, 0 — воскресенье' })
  weekday: number;

  @ApiProperty({
    enum: WEEK_MARKS,
    enumName: 'WeekMark',
    description:
      'Тренировка, пропуск, пауза, тренировочный день впереди, отдых',
  })
  mark: WeekMark;

  @ApiProperty()
  isToday: boolean;
}
