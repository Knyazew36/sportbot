import { ApiProperty } from '@nestjs/swagger';

import { AdminUserResponseDto } from './admin-user.response.dto';
import { AdminUserWeekResponseDto } from './admin-user-week.response.dto';
import { AdminUserWorkoutResponseDto } from './admin-user-workout.response.dto';

export class AdminUserDetailResponseDto extends AdminUserResponseDto {
  @ApiProperty({ type: Date, nullable: true })
  onboardedAt: Date | null;

  @ApiProperty()
  timeZone: string;

  @ApiProperty({ enum: ['MALE', 'FEMALE'], nullable: true })
  gender: 'MALE' | 'FEMALE' | null;

  @ApiProperty({ type: [Number], description: '0..6, 0 — воскресенье' })
  trainingDays: number[];

  @ApiProperty({ description: 'Бот задаёт утренний и вечерний вопросы' })
  questionsEnabled: boolean;

  @ApiProperty({ type: String, nullable: true })
  activeProgram: string | null;

  @ApiProperty()
  currentStreak: number;

  @ApiProperty()
  bestStreak: number;

  @ApiProperty({ description: 'Пропусков подряд' })
  missedInRow: number;

  @ApiProperty({ description: 'Сейчас на паузе' })
  paused: boolean;

  @ApiProperty({ description: 'Завершённых тренировок за всё время' })
  workoutsTotal: number;

  @ApiProperty({ description: 'Своих программ' })
  programs: number;

  @ApiProperty()
  friends: number;

  @ApiProperty({ description: 'Заявок в справочник' })
  requests: number;

  @ApiProperty()
  complaints: number;

  @ApiProperty({ description: 'Дней плана за 30 дней: сделано' })
  daysDone: number;

  @ApiProperty({ description: 'Дней плана за 30 дней: пропущено' })
  daysMissed: number;

  @ApiProperty({
    type: [AdminUserWeekResponseDto],
    description: 'Последние 12 недель, от старой к новой',
  })
  weeks: AdminUserWeekResponseDto[];

  @ApiProperty({
    type: [AdminUserWorkoutResponseDto],
    description: 'Последние 20 тренировок, новые сверху',
  })
  recentWorkouts: AdminUserWorkoutResponseDto[];
}
