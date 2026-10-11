import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  NotificationChannel,
  NotificationDigestFrequency,
} from '@/generated/prisma/client';

/** Ответ upsert-эндпоинтов — сырая строка NotificationSetting. */
export class NotificationSettingDto {
  @ApiProperty() id: number;
  @ApiProperty() organizationId: number;
  @ApiPropertyOptional({ type: Number, nullable: true }) userId: number | null;
  @ApiProperty() eventType: string;
  @ApiProperty({ enum: NotificationChannel }) channel: NotificationChannel;
  @ApiProperty() enabled: boolean;
  @ApiProperty({ enum: NotificationDigestFrequency })
  digestFrequency: NotificationDigestFrequency;
  @ApiPropertyOptional({ type: String, nullable: true }) quietHoursStart:
    string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) quietHoursEnd:
    string | null;
  @ApiProperty({ type: [Number] }) daysOfWeek: number[];
  @ApiPropertyOptional({ type: String, nullable: true }) notificationTime:
    string | null;
  @ApiPropertyOptional({ type: Object, nullable: true }) config: Record<
    string,
    unknown
  > | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
