import { ApiProperty } from '@nestjs/swagger';

export class VkLinkStartResponseDto {
  @ApiProperty({
    description:
      'Ссылка https://vk.me/club<groupId>?ref=link_<token> — открывает чат с сообществом, показывается QR-кодом',
  })
  url: string;

  @ApiProperty({ description: 'Когда ссылка протухнет, unix ms' })
  expiresAt: number;
}
