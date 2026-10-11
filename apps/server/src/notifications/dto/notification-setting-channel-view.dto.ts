import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { NotificationChannel } from '@/generated/prisma/client';

export class NotificationSettingChannelViewDto {
  @ApiProperty({ enum: NotificationChannel }) channel: NotificationChannel;

  @ApiProperty({
    description:
      'Дефолт организации (или дефолт из реестра, если его ещё не настраивали)',
  })
  orgEnabled: boolean;

  @ApiPropertyOptional({
    nullable: true,
    type: Boolean,
    description:
      'null = своего переопределения нет, используется дефолт организации',
  })
  userEnabled: boolean | null;

  @ApiProperty({ description: 'Итоговое значение: userEnabled ?? orgEnabled' })
  effectiveEnabled: boolean;
}
