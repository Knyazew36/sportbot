import { NotificationChannel, OrgRole } from '@/generated/prisma/client';

export interface NotificationEventSchedule {
  daysOfWeek: number[];
  notificationTime: string;
  roles: OrgRole[];
}

export interface NotificationEventDefinition {
  key: string;
  label: string;
  availableChannels: NotificationChannel[];
  defaultChannels: NotificationChannel[];
  /** Расписание cron-события, пока org его не настраивала; без него — общий дефолт NotificationsService. */
  defaultSchedule?: NotificationEventSchedule;
  /** Событийно-специфичный config (NotificationSetting.config), пока org его не настраивала. */
  defaultConfig?: Record<string, unknown>;
}

const ALL_CHANNELS: NotificationChannel[] = [
  NotificationChannel.TELEGRAM,
  NotificationChannel.MAX,
  NotificationChannel.VK,
  NotificationChannel.EMAIL,
  NotificationChannel.IN_APP,
];

/**
 * Реестр типов событий уведомлений — код, а не Prisma-enum, чтобы добавление
 * нового события не требовало миграции схемы (NotificationSetting.eventType
 * и Notification.eventType хранят просто строковый ключ отсюда).
 *
 * Проект дописывает сюда свои события и вызывает NotificationsService.notifyOrganization / notifyUser.
 */
export const NOTIFICATION_EVENTS = {
  JOIN_REQUEST_CREATED: {
    key: 'JOIN_REQUEST_CREATED',
    label: 'Новая заявка на вступление',
    availableChannels: ALL_CHANNELS,
    defaultChannels: [
      NotificationChannel.TELEGRAM,
      NotificationChannel.MAX,
      NotificationChannel.VK,
      NotificationChannel.IN_APP,
    ],
  },
  JOIN_REQUEST_DECIDED: {
    key: 'JOIN_REQUEST_DECIDED',
    label: 'Решение по заявке на вступление',
    availableChannels: ALL_CHANNELS,
    defaultChannels: [
      NotificationChannel.TELEGRAM,
      NotificationChannel.MAX,
      NotificationChannel.VK,
      NotificationChannel.EMAIL,
      NotificationChannel.IN_APP,
    ],
  },
} satisfies Record<string, NotificationEventDefinition>;

export type NotificationEventKey = keyof typeof NOTIFICATION_EVENTS;

export function getNotificationEvent(
  key: string,
): NotificationEventDefinition | undefined {
  return (NOTIFICATION_EVENTS as Record<string, NotificationEventDefinition>)[
    key
  ];
}
