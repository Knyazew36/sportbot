import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { paginatePrisma } from '@/common/prisma/prisma-paginate';
import { ENTITY_EMOJI } from '@/common/utils';
import {
  Notification,
  NotificationChannel,
  OrgRole,
  Prisma,
  User,
} from '@/generated/prisma/client';
import { MailService } from '@/mail/mail.service';
import {
  MessengerButton,
  MessengerChannelKey,
  MessengerRegistry,
} from '@/messengers';
import { PrismaService } from 'prisma/prisma.service';

import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { UpsertNotificationSettingDto } from './dto/upsert-notification-setting.dto';
import {
  getNotificationEvent,
  NOTIFICATION_EVENTS,
  NotificationEventDefinition,
  NotificationEventKey,
} from './event-registry';

export interface NotificationDeliveryParams {
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  /** Свои кнопки под сообщением в мессенджере вместо дефолтной «Открыть приложение». */
  messengerButtons?: MessengerButton[][];
}

export interface NotifyOrganizationParams extends NotificationDeliveryParams {
  organizationId: number;
  roles?: OrgRole[]; // фильтр по ролям получателей; по умолчанию — вся организация
}

export interface NotificationFailure {
  userId: number;
  channel: NotificationChannel;
  error: string;
}

export interface NotificationDeliveryResult {
  sent: number;
  failed: number;
  failures: NotificationFailure[];
}

const DEFAULT_DAYS_OF_WEEK = [1, 2, 3, 4, 5]; // понедельник — пятница
const DEFAULT_NOTIFICATION_TIME = '09:00';
const DEFAULT_ROLES: OrgRole[] = [OrgRole.OWNER, OrgRole.ADMIN];

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.notifications} ${NotificationsService.name}`,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly messengers: MessengerRegistry,
  ) {}

  // ── Отправка ────────────────────────────────────────────────────────────

  /**
   * Точка входа для доменных модулей: резолвит получателей и каналы по настройкам
   * (user override → org default → дефолт из реестра), персистит Notification-строку
   * на каждую пару (получатель, канал) и пытается доставить.
   */
  public async notifyOrganization(
    eventKey: NotificationEventKey,
    params: NotifyOrganizationParams,
  ): Promise<NotificationDeliveryResult> {
    const eventDef = this.requireEvent(eventKey);

    const [recipients, settings] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          orgMemberships: {
            some: {
              organizationId: params.organizationId,
              ...(params.roles?.length ? { role: { in: params.roles } } : {}),
            },
          },
        },
      }),
      this.prisma.notificationSetting.findMany({
        where: { organizationId: params.organizationId, eventType: eventKey },
      }),
    ]);

    const total: NotificationDeliveryResult = {
      sent: 0,
      failed: 0,
      failures: [],
    };
    for (const user of recipients) {
      const channels = this.resolveChannels(user.id, eventDef, settings);
      const result = await this.deliverToChannels(
        eventKey,
        params.organizationId,
        user,
        channels,
        params,
      );
      total.sent += result.sent;
      total.failed += result.failed;
      total.failures.push(...result.failures);
    }

    this.logger.log(
      `${eventKey} org=${params.organizationId}: получателей ${recipients.length}, отправлено ${total.sent}, ошибок ${total.failed}`,
    );
    return total;
  }

  /**
   * Точечная отправка одному пользователю (не по роли/broadcast) — для событий, которые
   * адресованы самому пользователю. Каналы резолвятся так же, как в notifyOrganization.
   */
  public async notifyUser(
    eventKey: NotificationEventKey,
    organizationId: number,
    userId: number,
    params: NotificationDeliveryParams,
  ): Promise<NotificationDeliveryResult> {
    const eventDef = this.requireEvent(eventKey);

    const [user, settings] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.notificationSetting.findMany({
        where: {
          organizationId,
          eventType: eventKey,
          OR: [{ userId }, { userId: null }],
        },
      }),
    ]);
    if (!user) {
      this.logger.warn(
        `${eventKey} org=${organizationId}: получатель userId=${userId} не найден`,
      );
      return { sent: 0, failed: 0, failures: [] };
    }

    const channels = this.resolveChannels(userId, eventDef, settings);
    const result = await this.deliverToChannels(
      eventKey,
      organizationId,
      user,
      channels,
      params,
    );
    this.logger.log(
      `${eventKey} org=${organizationId} userId=${userId}: отправлено ${result.sent}, ошибок ${result.failed}`,
    );
    return result;
  }

  // ── Настройки ───────────────────────────────────────────────────────────

  /** Матрица событие × канал для UI: org-level дефолты + overrides текущего пользователя. */
  public async listSettings(organizationId: number, userId: number) {
    const rows = await this.prisma.notificationSetting.findMany({
      where: { organizationId, OR: [{ userId: null }, { userId }] },
    });

    return Object.values(NOTIFICATION_EVENTS).map(
      (eventDef: NotificationEventDefinition) => {
        const orgRows = rows.filter(
          (r) => r.userId === null && r.eventType === eventDef.key,
        );

        return {
          eventType: eventDef.key,
          label: eventDef.label,
          channels: eventDef.availableChannels.map((channel) => {
            const orgRow = orgRows.find((r) => r.channel === channel);
            const userRow = rows.find(
              (r) =>
                r.userId === userId &&
                r.channel === channel &&
                r.eventType === eventDef.key,
            );
            const orgEnabled =
              orgRow?.enabled ?? eventDef.defaultChannels.includes(channel);
            return {
              channel,
              orgEnabled,
              userEnabled: userRow?.enabled ?? null, // null = нет override, используется org-дефолт
              effectiveEnabled: userRow?.enabled ?? orgEnabled,
            };
          }),
          ...this.resolveSchedule(orgRows, eventDef),
        };
      },
    );
  }

  /**
   * Расписание (дни недели + время) для cron-событий — задаётся только на org-уровне и одинаково
   * для всех каналов события; UI при сохранении пишет его во все channel-строки события разом,
   * поэтому достаточно взять первую непустую. Сверять с текущим временем — isScheduledNow (schedule.util.ts).
   */
  public async getEventSchedule(organizationId: number, eventType: string) {
    const rows = await this.prisma.notificationSetting.findMany({
      where: { organizationId, userId: null, eventType },
    });
    return this.resolveSchedule(rows, getNotificationEvent(eventType));
  }

  /** userId = null → org-level дефолт, иначе — персональный override. */
  public async upsertSetting(
    organizationId: number,
    userId: number | null,
    dto: UpsertNotificationSettingDto,
  ) {
    // roles — отдельное поле в DTO, но хранится внутри config (нет выделенной колонки под роли)
    const config = dto.roles
      ? { ...(dto.config ?? {}), roles: dto.roles }
      : dto.config;

    const data = {
      enabled: dto.enabled,
      digestFrequency: dto.digestFrequency,
      quietHoursStart: dto.quietHoursStart,
      quietHoursEnd: dto.quietHoursEnd,
      daysOfWeek: dto.daysOfWeek,
      notificationTime: dto.notificationTime,
      config: config as Prisma.InputJsonValue,
    };

    // Уникальность (organizationId, userId, eventType, channel) для userId = null не защищена
    // на уровне БД (Postgres не считает NULL равным NULL) — upsert по ней невозможен, ищем строку сами.
    const existing = await this.prisma.notificationSetting.findFirst({
      where: {
        organizationId,
        userId,
        eventType: dto.eventType,
        channel: dto.channel,
      },
      select: { id: true },
    });

    const setting = existing
      ? await this.prisma.notificationSetting.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.notificationSetting.create({
          data: {
            organizationId,
            userId,
            eventType: dto.eventType,
            channel: dto.channel,
            ...data,
          },
        });

    this.logger.log(
      `Настройка ${dto.eventType}/${dto.channel} org=${organizationId} userId=${userId ?? 'org'} → enabled=${dto.enabled}`,
    );
    return setting;
  }

  // ── Лента ───────────────────────────────────────────────────────────────

  /** Лента (колокольчик) текущего пользователя — только IN_APP-строки. */
  public async listNotifications(
    userId: number,
    query: ListNotificationsQueryDto,
  ) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      channel: NotificationChannel.IN_APP,
      ...(query.filter_unread ? { readAt: null } : {}),
      ...(query.filter_organizationId
        ? { organizationId: query.filter_organizationId }
        : {}),
    };

    const result = await paginatePrisma(this.prisma.notification, {
      page: query.page,
      limit: query.limit,
      where,
      orderBy: { createdAt: 'desc' },
    });
    this.logger.debug(`Лента userId=${userId}: ${result.meta.total}`);
    return result;
  }

  public async countUnread(userId: number): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, channel: NotificationChannel.IN_APP, readAt: null },
    });
    return { count };
  }

  public async getOne(
    userId: number,
    notificationId: number,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Уведомление не найдено');
    }
    return notification;
  }

  public async markRead(
    userId: number,
    notificationId: number,
  ): Promise<Notification> {
    try {
      // Принадлежность пользователю — в where самой мутации: чужое уведомление даст P2025
      return await this.prisma.notification.update({
        where: { id: notificationId, userId },
        data: { readAt: new Date(), status: 'READ' },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Уведомление не найдено');
      }
      throw error;
    }
  }

  public async markAllRead(userId: number): Promise<{ count: number }> {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, channel: NotificationChannel.IN_APP, readAt: null },
      data: { readAt: new Date(), status: 'READ' },
    });
    this.logger.log(`Прочитаны все уведомления userId=${userId}: ${count}`);
    return { count };
  }

  // ── Вспомогательное ─────────────────────────────────────────────────────

  private requireEvent(eventKey: string): NotificationEventDefinition {
    const eventDef = getNotificationEvent(eventKey);
    if (!eventDef) {
      throw new Error(`Неизвестное событие уведомлений: ${eventKey}`);
    }
    return eventDef;
  }

  /** Персистит Notification-строку на каждый канал и пытается доставить. */
  private async deliverToChannels(
    eventKey: NotificationEventKey,
    organizationId: number,
    user: User,
    channels: NotificationChannel[],
    params: NotificationDeliveryParams,
  ): Promise<NotificationDeliveryResult> {
    const result: NotificationDeliveryResult = {
      sent: 0,
      failed: 0,
      failures: [],
    };

    for (const channel of channels) {
      // Нет адресата — канал просто не участвует в доставке, без FAILED-строки в журнале
      if (channel === 'EMAIL' && !user.email) continue;
      // Мессенджер не подключён, аккаунт не привязан или бот не может писать (у MAX — закрыт чат)
      if (
        this.isMessenger(channel) &&
        !this.messengers.get(channel)?.canDeliver(user)
      )
        continue;

      const notification = await this.prisma.notification.create({
        data: {
          organizationId,
          userId: user.id,
          eventType: eventKey,
          channel,
          title: params.title,
          body: params.body,
          payload: (params.payload ?? undefined) as Prisma.InputJsonValue,
        },
      });

      try {
        await this.dispatch(channel, user, notification, params);
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        result.sent++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Не удалось доставить ${eventKey} userId=${user.id} канал=${channel}: ${errorMessage}`,
          error instanceof Error ? error.stack : undefined,
        );
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'FAILED', error: errorMessage },
        });
        result.failed++;
        result.failures.push({ userId: user.id, channel, error: errorMessage });
      }
    }

    return result;
  }

  /** user-level строка перекрывает org-level (userId = null) перекрывает дефолт реестра. */
  private resolveChannels(
    userId: number,
    eventDef: NotificationEventDefinition,
    settings: {
      userId: number | null;
      channel: NotificationChannel;
      enabled: boolean;
    }[],
  ): NotificationChannel[] {
    return eventDef.availableChannels.filter((channel) => {
      const userRow = settings.find(
        (s) => s.userId === userId && s.channel === channel,
      );
      if (userRow) return userRow.enabled;

      const orgRow = settings.find(
        (s) => s.userId === null && s.channel === channel,
      );
      if (orgRow) return orgRow.enabled;

      return eventDef.defaultChannels.includes(channel);
    });
  }

  private async dispatch(
    channel: NotificationChannel,
    user: User,
    notification: Notification,
    params: NotificationDeliveryParams,
  ): Promise<void> {
    switch (channel) {
      case 'IN_APP':
        // Уже персистировано — доставка in-app это сам факт наличия строки в ленте
        return;
      case 'EMAIL':
        if (!user.email) throw new Error('У пользователя не указан email');
        await this.mailService.sendNotificationEmail(
          user.email,
          notification.title,
          notification.body,
        );
        return;
      case 'TELEGRAM':
      case 'MAX':
      case 'VK': {
        // Мессенджеры — через общий реестр (src/messengers): сервису всё равно, какой бот внутри
        const messenger = this.messengers.get(channel);
        if (!messenger) throw new Error(`Мессенджер ${channel} не подключён`);
        await messenger.send(user, {
          text: `${notification.title}\n\n${notification.body}`,
          buttons: params.messengerButtons ?? [
            [{ kind: 'open_app', text: '🚀 Открыть приложение' }],
          ],
        });
        return;
      }
    }
  }

  /** EMAIL и IN_APP доставляет сам сервис, остальные каналы — мессенджеры из реестра. */
  private isMessenger(
    channel: NotificationChannel,
  ): channel is MessengerChannelKey {
    return channel !== 'EMAIL' && channel !== 'IN_APP';
  }

  /**
   * config — событийные параметры поверх defaultConfig реестра, без roles (у них своё поле).
   * Как и расписание, UI пишет config во все channel-строки разом — берём первую непустую.
   */
  private resolveSchedule(
    rows: {
      daysOfWeek: number[];
      notificationTime: string | null;
      config: Prisma.JsonValue;
    }[],
    eventDef?: NotificationEventDefinition,
  ) {
    const rolesRow = rows
      .map((r) => this.extractRoles(r.config))
      .find((roles) => !!roles?.length);
    const configRow = rows
      .map((r) => this.extractConfig(r.config))
      .find((config) => !!config);

    return {
      daysOfWeek:
        rows.find((r) => r.daysOfWeek.length > 0)?.daysOfWeek ??
        eventDef?.defaultSchedule?.daysOfWeek ??
        DEFAULT_DAYS_OF_WEEK,
      notificationTime:
        rows.find((r) => r.notificationTime)?.notificationTime ??
        eventDef?.defaultSchedule?.notificationTime ??
        DEFAULT_NOTIFICATION_TIME,
      roles: rolesRow ?? eventDef?.defaultSchedule?.roles ?? DEFAULT_ROLES,
      config: {
        ...(eventDef?.defaultConfig ?? {}),
        ...(configRow ?? {}),
      } as Record<string, unknown>,
    };
  }

  private extractConfig(
    config: Prisma.JsonValue,
  ): Record<string, unknown> | null {
    if (!config || typeof config !== 'object' || Array.isArray(config))
      return null;
    const rest = { ...(config as Record<string, unknown>) };
    delete rest.roles;
    return Object.keys(rest).length ? rest : null;
  }

  /** roles хранятся внутри config (нет отдельной колонки) — см. UpsertNotificationSettingDto.roles. */
  private extractRoles(config: Prisma.JsonValue): OrgRole[] | null {
    if (!config || typeof config !== 'object' || Array.isArray(config))
      return null;
    const roles = (config as Record<string, unknown>).roles;
    if (!Array.isArray(roles)) return null;
    const validRoles = Object.values(OrgRole) as string[];
    return roles.filter(
      (role): role is OrgRole =>
        typeof role === 'string' && validRoles.includes(role),
    );
  }
}
