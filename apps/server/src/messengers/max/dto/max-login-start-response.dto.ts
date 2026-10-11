import { ApiProperty } from '@nestjs/swagger';

export class MaxLoginStartResponseDto {
  @ApiProperty({
    description: 'Одноразовый токен — им браузер поллит статус входа',
  })
  token: string;

  @ApiProperty({
    description:
      'Ссылка https://max.ru/<bot>?start=login_<token> — открывает чат с ботом, показывается QR-кодом',
  })
  url: string;

  @ApiProperty({ description: 'Когда ссылка протухнет, unix ms' })
  expiresAt: number;
}
