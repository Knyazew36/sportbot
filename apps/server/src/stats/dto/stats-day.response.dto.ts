import { ApiProperty } from '@nestjs/swagger';

import {
  CALENDAR_MARKS,
  CalendarMark,
} from './stats-calendar-day.response.dto';
import { StatsDayWorkoutResponseDto } from './stats-day-workout.response.dto';

export class StatsDayResponseDto {
  @ApiProperty({ example: '2026-10-13' })
  date: string;

  @ApiProperty({ enum: CALENDAR_MARKS, enumName: 'CalendarMark' })
  mark: CalendarMark;

  @ApiProperty({ type: Number, nullable: true, description: 'День плана' })
  dayId: number | null;

  @ApiProperty({
    type: [String],
    enum: ['DONE', 'MISSED'],
    description: 'На что можно исправить отметку (своя, в пределах 7 дней)',
  })
  fixTo: ('DONE' | 'MISSED')[];

  @ApiProperty({ type: [StatsDayWorkoutResponseDto] })
  workouts: StatsDayWorkoutResponseDto[];
}
