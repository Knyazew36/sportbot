import { ApiProperty } from '@nestjs/swagger';

export class FriendResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  currentStreak: number;

  @ApiProperty({
    description: 'Сегодня (по его часовому поясу) есть засчитанная тренировка',
  })
  trainedToday: boolean;

  @ApiProperty()
  paused: boolean;
}
