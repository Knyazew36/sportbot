import { ApiProperty } from '@nestjs/swagger';

import { OrgRole } from '@/generated/prisma/client';

import { NotificationSettingChannelViewDto } from './notification-setting-channel-view.dto';

export class NotificationEventSettingsDto {
  @ApiProperty() eventType: string;
  @ApiProperty() label: string;
  @ApiProperty({ type: [NotificationSettingChannelViewDto] })
  channels: NotificationSettingChannelViewDto[];

  @ApiProperty({
    type: [Number],
    description: 'Расписание организации: дни недели (0-6, 0 — воскресенье)',
  })
  daysOfWeek: number[];

  @ApiProperty({
    description: 'Расписание организации: время отправки, "HH:mm"',
  })
  notificationTime: string;

  @ApiProperty({
    enum: OrgRole,
    isArray: true,
    description: 'Какие роли получают событие',
  })
  roles: OrgRole[];

  @ApiProperty({
    type: Object,
    description:
      'Событийные параметры поверх дефолта реестра (без roles). При сохранении отправлять целиком — config перезаписывается',
  })
  config: Record<string, unknown>;
}
