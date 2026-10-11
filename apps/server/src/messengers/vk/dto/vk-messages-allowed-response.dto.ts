import { ApiProperty } from '@nestjs/swagger';

export class VkMessagesAllowedResponseDto {
  @ApiProperty({
    description:
      'Разрешил ли пользователь сообщения от сообщества — по данным VK (messages.isMessagesFromGroupAllowed)',
  })
  allowed: boolean;
}
