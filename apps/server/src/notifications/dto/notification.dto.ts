import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  NotificationChannel,
  NotificationStatus,
} from '@/generated/prisma/client';

export class NotificationDto {
  @ApiProperty() id: number;
  @ApiProperty() organizationId: number;
  @ApiProperty() userId: number;
  @ApiProperty({
    description: 'Ключ события из notifications/event-registry.ts',
  })
  eventType: string;
  @ApiProperty({ enum: NotificationChannel }) channel: NotificationChannel;
  @ApiProperty() title: string;
  @ApiProperty() body: string;
  @ApiPropertyOptional({ type: Object, nullable: true }) payload: Record<
    string,
    unknown
  > | null;
  @ApiProperty({ enum: NotificationStatus }) status: NotificationStatus;
  @ApiPropertyOptional({ type: Date, nullable: true }) readAt: Date | null;
  @ApiPropertyOptional({ type: Date, nullable: true }) sentAt: Date | null;
  @ApiPropertyOptional({ type: String, nullable: true }) error: string | null;
  @ApiProperty() createdAt: Date;
}
