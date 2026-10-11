import { ApiProperty } from '@nestjs/swagger';

export class MaxLinkStartResponseDto {
  @ApiProperty({
    description:
      'Ссылка https://max.ru/<bot>?start=link_<token> — открывает чат с ботом, показывается QR-кодом',
  })
  url: string;

  @ApiProperty({ description: 'Когда ссылка протухнет, unix ms' })
  expiresAt: number;
}
