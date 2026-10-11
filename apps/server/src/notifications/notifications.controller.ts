import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { SkipAudit } from '@/audit-log/decorators/skip-audit.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { OrganizationId } from '@/common/decorators/organization-id.decorator';
import { RequireOrgRole } from '@/common/decorators/require-org-role.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { MultiAuthGuard } from '@/common/guards/multi-auth.guard';
import { OrgScopeGuard } from '@/common/guards/org-scope.guard';
import { OrgRole } from '@/generated/prisma/client';

import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationEventSettingsDto } from './dto/notification-event-settings.dto';
import { NotificationSettingDto } from './dto/notification-setting.dto';
import { NotificationSettingsQueryDto } from './dto/notification-settings-query.dto';
import { NotificationDto } from './dto/notification.dto';
import { UnreadCountDto } from './dto/unread-count.dto';
import { UpsertNotificationSettingDto } from './dto/upsert-notification-setting.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@UseGuards(MultiAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // --- лента текущего пользователя (по всем его организациям) ---

  @Get('list')
  @Swagger({
    title: 'Лента уведомлений текущего пользователя (колокольчик)',
    query: ListNotificationsQueryDto,
    response: NotificationDto,
    isArray: true,
    bearerAuth: true,
  })
  list(
    @CurrentUser('id') userId: number,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.notificationsService.listNotifications(userId, query);
  }

  @Get('unread-count')
  @Swagger({
    title: 'Число непрочитанных уведомлений в ленте',
    response: UnreadCountDto,
    bearerAuth: true,
  })
  countUnread(@CurrentUser('id') userId: number) {
    return this.notificationsService.countUnread(userId);
  }

  @Post('read-all')
  @SkipAudit()
  @Swagger({
    title: 'Отметить все уведомления прочитанными',
    response: UnreadCountDto,
    bearerAuth: true,
  })
  markAllRead(@CurrentUser('id') userId: number) {
    return this.notificationsService.markAllRead(userId);
  }

  @Post('read/:id')
  @SkipAudit()
  @Swagger({
    title: 'Отметить уведомление прочитанным',
    param: { name: 'id', type: Number },
    response: NotificationDto,
    bearerAuth: true,
  })
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.notificationsService.markRead(userId, id);
  }

  // --- настройки каналов (в разрезе организации) ---

  @Get('settings')
  @UseGuards(OrgScopeGuard)
  @Swagger({
    title:
      'Матрица событие × канал: дефолты организации + свои переопределения',
    query: NotificationSettingsQueryDto,
    response: NotificationEventSettingsDto,
    plainArray: true,
    bearerAuth: true,
  })
  getSettings(
    @OrganizationId() organizationId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.notificationsService.listSettings(organizationId, userId);
  }

  @Post('settings/org')
  @UseGuards(OrgScopeGuard)
  @RequireOrgRole(OrgRole.ADMIN)
  @Swagger({
    title: 'Дефолт организации для события × канала (OWNER/ADMIN)',
    body: UpsertNotificationSettingDto,
    response: NotificationSettingDto,
    bearerAuth: true,
  })
  upsertOrgSetting(
    @OrganizationId() organizationId: number,
    @Body() dto: UpsertNotificationSettingDto,
  ) {
    return this.notificationsService.upsertSetting(organizationId, null, dto);
  }

  @Post('settings/me')
  @UseGuards(OrgScopeGuard)
  @Swagger({
    title: 'Своё переопределение события × канала поверх дефолта организации',
    body: UpsertNotificationSettingDto,
    response: NotificationSettingDto,
    bearerAuth: true,
  })
  upsertMySetting(
    @OrganizationId() organizationId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpsertNotificationSettingDto,
  ) {
    return this.notificationsService.upsertSetting(organizationId, userId, dto);
  }

  @Get(':id')
  @Swagger({
    title: 'Уведомление по id',
    param: { name: 'id', type: Number },
    response: NotificationDto,
    bearerAuth: true,
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.notificationsService.getOne(userId, id);
  }
}
