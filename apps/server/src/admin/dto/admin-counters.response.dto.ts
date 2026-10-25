import { ApiProperty } from '@nestjs/swagger';

export class AdminCountersResponseDto {
  @ApiProperty({ description: 'Пользователей с профилем — все, кто в списке админки' })
  users: number;

  @ApiProperty({ description: 'Тренировок за эту неделю' })
  workouts: number;

  @ApiProperty({ description: 'Заявок ждут решения' })
  requests: number;

  @ApiProperty({ description: 'Открытых жалоб' })
  complaints: number;

  @ApiProperty({
    description:
      'Программ пользователей ждут проверки: публикация, текст, свои теги',
  })
  programReviews: number;

  @ApiProperty()
  exercises: number;

  @ApiProperty()
  stretches: number;
}
