import { ApiProperty } from '@nestjs/swagger';

export class FriendInviteResponseDto {
  @ApiProperty({
    description:
      'Ссылка для «Поделиться»: на бота того мессенджера, откуда открыто приложение',
  })
  url: string;

  @ApiProperty({ type: String, nullable: true })
  telegram: string | null;

  @ApiProperty({ type: String, nullable: true })
  max: string | null;

  @ApiProperty({ description: 'Текст приглашения' })
  text: string;
}
