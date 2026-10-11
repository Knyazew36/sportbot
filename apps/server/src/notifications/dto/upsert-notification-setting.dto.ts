import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

import {
  NotificationChannel,
  NotificationDigestFrequency,
  OrgRole,
} from '@/generated/prisma/client';

import { NOTIFICATION_EVENTS } from '../event-registry';

const EVENT_KEYS = Object.keys(NOTIFICATION_EVENTS);
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpsertNotificationSettingDto {
  @ApiProperty({ description: 'ID организации', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId: number;

  @ApiProperty({
    enum: EVENT_KEYS,
    description: 'Ключ события из реестра notifications/event-registry.ts',
  })
  @IsIn(EVENT_KEYS)
  eventType: string;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ enum: NotificationDigestFrequency })
  @IsOptional()
  @IsEnum(NotificationDigestFrequency)
  digestFrequency?: NotificationDigestFrequency;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  quietHoursStart?: string;

  @ApiPropertyOptional({ example: '21:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  quietHoursEnd?: string;

  @ApiPropertyOptional({
    type: [Number],
    description: '0-6, где 0 — воскресенье. Пусто = все дни',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[];

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  notificationTime?: string;

  @ApiPropertyOptional({
    enum: OrgRole,
    isArray: true,
    description:
      'Кто получает событие (уровень организации, применяется ко всем каналам). Хранится в config.roles — отдельной колонки под роли нет.',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(OrgRole, { each: true })
  roles?: OrgRole[];

  @ApiPropertyOptional({
    description: 'Событийно-специфичные параметры, напр. { threshold: 5 }',
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
