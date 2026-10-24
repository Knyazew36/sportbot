import { ApiProperty } from '@nestjs/swagger';

import { AdminStatsDayResponseDto } from './admin-stats-day.response.dto';

export class AdminStatsResponseDto {
  @ApiProperty({ description: 'Всего пользователей спортбота' })
  usersTotal: number;

  @ApiProperty({ description: 'Прошли первый запуск' })
  usersOnboarded: number;

  @ApiProperty({ description: 'Новых за 7 дней' })
  usersNew7: number;

  @ApiProperty({ description: 'Новых за 30 дней' })
  usersNew30: number;

  @ApiProperty({ description: 'Тренировались сегодня' })
  activeToday: number;

  @ApiProperty({ description: 'Тренировались за 7 дней' })
  active7: number;

  @ApiProperty({ description: 'Тренировались за 30 дней' })
  active30: number;

  @ApiProperty({ description: 'Завершённых тренировок за 7 дней' })
  workouts7: number;

  @ApiProperty({ description: 'Завершённых тренировок за 30 дней' })
  workouts30: number;

  @ApiProperty({ description: 'Завершённых тренировок за всё время' })
  workoutsTotal: number;

  @ApiProperty({
    type: [AdminStatsDayResponseDto],
    description: 'Последние 30 дней, от старого к новому',
  })
  days: AdminStatsDayResponseDto[];
}
