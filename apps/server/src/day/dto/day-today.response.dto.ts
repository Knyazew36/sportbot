import { ApiProperty } from '@nestjs/swagger';

import { DayComplexBriefResponseDto } from './day-complex-brief.response.dto';
import { DayComplexResponseDto } from './day-complex.response.dto';
import { DayNextResponseDto } from './day-next.response.dto';
import { DayPauseResponseDto } from './day-pause.response.dto';
import { DayStreakResponseDto } from './day-streak.response.dto';
import { DayWeekCellResponseDto } from './day-week-cell.response.dto';
import { DayWorkoutResponseDto } from './day-workout.response.dto';

export const DAY_STATES = [
  'ONBOARDING',
  'NO_PROGRAM',
  'TRAINING',
  'REST',
  'IN_PROGRESS',
  'DONE',
  'MISSED',
  'PAUSE',
] as const;
export type DayState = (typeof DAY_STATES)[number];

export class DayTodayResponseDto {
  @ApiProperty({
    enum: DAY_STATES,
    enumName: 'DayState',
    description: 'Состояние дня (frontend-tz, 7)',
  })
  state: DayState;

  @ApiProperty({
    example: '2026-10-13',
    description: 'Сегодня по поясу пользователя',
  })
  date: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'День плана на сегодня; null — бот ещё не заводил его',
  })
  dayId: number | null;

  @ApiProperty({ type: DayStreakResponseDto })
  streak: DayStreakResponseDto;

  @ApiProperty({
    type: [DayWeekCellResponseDto],
    description: 'Текущая неделя с понедельника',
  })
  week: DayWeekCellResponseDto[];

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Активная программа',
  })
  programName: string | null;

  @ApiProperty({
    type: [DayComplexBriefResponseDto],
    description: 'Комплексы активной программы по очереди',
  })
  complexes: DayComplexBriefResponseDto[];

  @ApiProperty({
    type: DayComplexResponseDto,
    nullable: true,
    description: 'Комплекс дня: по очереди или выбранный (TRAINING, REST)',
  })
  complex: DayComplexResponseDto | null;

  @ApiProperty({
    type: DayWorkoutResponseDto,
    nullable: true,
    description:
      'Начатая (IN_PROGRESS) или засчитанная сегодня (DONE) тренировка',
  })
  workout: DayWorkoutResponseDto | null;

  @ApiProperty({
    description:
      'Засчитано тренировок сегодня: больше одной — была ещё и внеплановая',
  })
  workoutsToday: number;

  @ApiProperty({
    type: DayNextResponseDto,
    nullable: true,
    description:
      'Что дальше: ближайший тренировочный день и комплекс по очереди (DONE, REST, MISSED, PAUSE)',
  })
  next: DayNextResponseDto | null;

  @ApiProperty({ type: DayPauseResponseDto, nullable: true })
  pause: DayPauseResponseDto | null;

  @ApiProperty({
    description: 'После пропуска ждём ответа «напомнить завтра?»',
  })
  rescheduleOffered: boolean;

  @ApiProperty({ description: 'Бот уже задал вечерний вопрос, ответа нет' })
  eveningAsked: boolean;
}
