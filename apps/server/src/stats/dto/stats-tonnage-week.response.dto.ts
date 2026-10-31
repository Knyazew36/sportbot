import { ApiProperty } from '@nestjs/swagger';

export class StatsTonnageWeekResponseDto {
  @ApiProperty({ example: '2026-10-12', description: 'Понедельник недели' })
  weekStart: string;

  @ApiProperty({ description: 'Поднято за неделю, кг (вес × повторы)' })
  tonnage: number;

  @ApiProperty({ description: 'Тренировок за неделю' })
  workouts: number;
}
