import { ApiProperty } from '@nestjs/swagger';

export class TelegramLinkStartResponseDto {
  @ApiProperty({
    description:
      'Ссылка https://t.me/<bot>?start=link_<token> — открывает чат с ботом, показывается QR-кодом',
  })
  url: string;

  @ApiProperty({ description: 'Когда ссылка протухнет, unix ms' })
  expiresAt: number;
}
