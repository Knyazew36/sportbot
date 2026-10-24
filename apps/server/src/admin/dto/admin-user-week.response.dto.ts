import { ApiProperty } from '@nestjs/swagger';

export class AdminUserWeekResponseDto {
  @ApiProperty({ description: 'Понедельник недели, YYYY-MM-DD' })
  week: string;

  @ApiProperty({ description: 'Завершённых тренировок' })
  workouts: number;
}
