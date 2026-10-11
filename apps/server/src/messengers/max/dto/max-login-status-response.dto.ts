import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MaxLoginStatusUserDto } from './max-login-status-user.dto';

export const MAX_LOGIN_STATUSES = [
  'pending',
  'confirmed',
  'rejected',
  'expired',
] as const;

export class MaxLoginStatusResponseDto {
  @ApiProperty({
    enum: MAX_LOGIN_STATUSES,
    enumName: 'MaxLoginStatus',
    description:
      'pending — ждём подтверждения в чате; confirmed — сессия выдана (отдаётся один раз); rejected — пользователь нажал «Отклонить»; expired — ссылки нет или она протухла',
  })
  status: (typeof MAX_LOGIN_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Только при confirmed' })
  accessToken?: string;

  @ApiPropertyOptional({
    description:
      'Только при confirmed: аккаунт создан этим входом (первая регистрация)',
  })
  isNewUser?: boolean;

  @ApiPropertyOptional({
    type: MaxLoginStatusUserDto,
    description: 'Только при confirmed',
  })
  user?: MaxLoginStatusUserDto;
}
