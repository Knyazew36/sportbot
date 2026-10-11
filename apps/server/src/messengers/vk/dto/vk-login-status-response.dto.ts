import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { VkLoginStatusUserDto } from './vk-login-status-user.dto';

export const VK_LOGIN_STATUSES = [
  'pending',
  'confirmed',
  'rejected',
  'expired',
] as const;

export class VkLoginStatusResponseDto {
  @ApiProperty({
    enum: VK_LOGIN_STATUSES,
    enumName: 'VkLoginStatus',
    description:
      'pending — ждём подтверждения в чате сообщества; confirmed — сессия выдана (отдаётся один раз); rejected — пользователь нажал «Отклонить»; expired — ссылки нет или она протухла',
  })
  status: (typeof VK_LOGIN_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Только при confirmed' })
  accessToken?: string;

  @ApiPropertyOptional({
    description:
      'Только при confirmed: аккаунт создан этим входом (первая регистрация)',
  })
  isNewUser?: boolean;

  @ApiPropertyOptional({
    type: VkLoginStatusUserDto,
    description: 'Только при confirmed',
  })
  user?: VkLoginStatusUserDto;
}
