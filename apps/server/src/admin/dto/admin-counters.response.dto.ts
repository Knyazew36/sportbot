import { ApiProperty } from '@nestjs/swagger';

export class AdminCountersResponseDto {
  @ApiProperty({ description: 'Пользователей с пройденной настройкой' })
  users: number;

  @ApiProperty({ description: 'Тренировок за эту неделю' })
  workouts: number;

  @ApiProperty({ description: 'Заявок ждут решения' })
  requests: number;

  @ApiProperty({ description: 'Открытых жалоб' })
  complaints: number;

  @ApiProperty()
  exercises: number;

  @ApiProperty()
  stretches: number;
}
