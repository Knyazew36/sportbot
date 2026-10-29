import { ApiProperty } from '@nestjs/swagger';

export const CALENDAR_MARKS = [
  'DONE',
  'MISSED',
  'PAUSED',
  'PLAN',
  'REST',
] as const;
export type CalendarMark = (typeof CALENDAR_MARKS)[number];

export class StatsCalendarDayResponseDto {
  @ApiProperty({ example: '2026-10-13' })
  date: string;

  @ApiProperty({
    enum: CALENDAR_MARKS,
    enumName: 'CalendarMark',
    description:
      'Тренировка, пропуск, пауза, тренировочный день (сегодня и впереди), отдых',
  })
  mark: CalendarMark;
}
