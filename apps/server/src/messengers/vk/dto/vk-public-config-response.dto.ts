import { ApiProperty } from '@nestjs/swagger';

export class VkPublicConfigResponseDto {
  @ApiProperty({
    description:
      'id сообщества — для VKWebAppAllowMessagesFromGroup в мини-приложении',
  })
  groupId: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'id мини-приложения VK; null — не настроено',
  })
  appId: number | null;
}
