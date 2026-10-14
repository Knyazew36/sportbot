import { ApiProperty } from '@nestjs/swagger';

export const CALENDAR_MARKS = [
  'DONE',
  'MISSED',
  'PAUSED',
  'RESCHEDULED',
  'PENDING',
  'REST',
  'FUTURE',
] as const;
export type CalendarMark = (typeof CALENDAR_MARKS)[number];

export class StatsCalendarDayResponseDto {
  @ApiProperty({ example: '2026-10-13' })
  date: string;

  @ApiProperty({
    enum: CALENDAR_MARKS,
    enumName: 'CalendarMark',
    description:
      'Тренировка, пропуск, пауза, перенос, ожидает ответа, отдых, впереди',
  })
  mark: CalendarMark;
}
