import { ApiProperty } from '@nestjs/swagger';

export class VkLoginStartResponseDto {
  @ApiProperty({
    description: 'Одноразовый токен — им браузер поллит статус входа',
  })
  token: string;

  @ApiProperty({
    description:
      'Ссылка https://vk.me/club<groupId>?ref=login_<token> — открывает чат с сообществом, показывается QR-кодом',
  })
  url: string;

  @ApiProperty({ description: 'Когда ссылка протухнет, unix ms' })
  expiresAt: number;
}
