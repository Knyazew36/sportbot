import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { TelegramLoginStatusUserDto } from './telegram-login-status-user.dto';

export const TELEGRAM_LOGIN_STATUSES = [
  'pending',
  'confirmed',
  'rejected',
  'expired',
] as const;

export class TelegramLoginStatusResponseDto {
  @ApiProperty({
    enum: TELEGRAM_LOGIN_STATUSES,
    enumName: 'TelegramLoginStatus',
    description:
      'pending — ждём подтверждения в чате; confirmed — сессия выдана (отдаётся один раз); rejected — пользователь нажал «Отклонить»; expired — ссылки нет или она протухла',
  })
  status: (typeof TELEGRAM_LOGIN_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Только при confirmed' })
  accessToken?: string;

  @ApiPropertyOptional({
    description:
      'Только при confirmed: аккаунт создан этим входом (первая регистрация)',
  })
  isNewUser?: boolean;

  @ApiPropertyOptional({
    type: TelegramLoginStatusUserDto,
    description: 'Только при confirmed',
  })
  user?: TelegramLoginStatusUserDto;
}
