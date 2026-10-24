import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsDayResponseDto {
  @ApiProperty({ description: 'День, YYYY-MM-DD' })
  date: string;

  @ApiProperty({ description: 'Новых пользователей спортбота' })
  newUsers: number;

  @ApiProperty({ description: 'Пользователей, начавших тренировку' })
  activeUsers: number;

  @ApiProperty({ description: 'Завершённых тренировок' })
  workouts: number;
}
