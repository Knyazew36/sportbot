import { ApiProperty } from '@nestjs/swagger';

import { BotChannel } from '@/generated/prisma/client';

export class MiniappMeResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty({ description: 'Имя для друзей' })
  displayName: string;

  @ApiProperty({ description: 'Администратор спортбота: виден раздел «Админ»' })
  isAdmin: boolean;

  @ApiProperty({ description: 'Текущий шаг первого запуска, 1..3' })
  onboardingStep: number;

  @ApiProperty({ description: 'Первый запуск закончен' })
  onboarded: boolean;

  @ApiProperty({
    enum: ['TELEGRAM', 'MAX'],
    nullable: true,
    description: 'Мессенджер, из которого открыто приложение',
  })
  channel: BotChannel | null;

  @ApiProperty({
    description:
      'Бот может писать пользователю в этот мессенджер; false — показать запрос разрешения',
  })
  canMessage: boolean;
}
