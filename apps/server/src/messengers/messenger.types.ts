/**
 * Каналы-мессенджеры. Ключи совпадают со значениями enum NotificationChannel проекта —
 * так уведомления находят канал в реестре без маппинга.
 */
export type MessengerChannelKey = 'MAX' | 'TELEGRAM' | 'VK';

/**
 * Пользователь, каким его видят модули мессенджеров. Это не модель проекта: проект отдаёт сюда
 * свои строки пользователей (см. MessengerUserStore), а модулям достаточно этих полей.
 * Лишние поля проектной модели сохраняются — объект проходит сквозь модуль как есть
 * (например, стратегия мини-приложения кладёт его в req.user).
 */
export interface MessengerUser {
  id: number;
  email: string | null;
  telegramId: string | null;
  maxId: string | null;
  vkId: string | null;
  /** Сырые профили из мессенджеров (initData / апдейты бота). */
  telegramData: unknown;
  maxData: unknown;
  vkData: unknown;
  /** Служебные маркеры диалогов с ботами (telegramDialogStartedAt и т.п.). */
  data: unknown;
  /** Когда заведён — по нему вход через бота отличает нового пользователя от вернувшегося. */
  createdAt: Date;
}

export interface MessengerUserPatch {
  /** Профиль пользователя в этом мессенджере — целиком заменяет прежний. Не передан — не трогать. */
  profile?: Record<string, unknown>;
  /** Служебные маркеры — целиком заменяют прежние. Не переданы — не трогать. */
  data?: Record<string, unknown>;
}

/**
 * Хранилище пользователей — единственное, что модулям мессенджеров нужно от БД проекта.
 * Проект реализует его поверх своей ORM и передаёт в MessengersModule.forRoot({ userStore }).
 */
export abstract class MessengerUserStore {
  /** Пользователь, к которому привязан этот аккаунт мессенджера, или null. */
  public abstract findByExternalId(
    channel: MessengerChannelKey,
    externalId: string,
  ): Promise<MessengerUser | null>;

  /** Найти пользователя по аккаунту мессенджера и обновить его либо завести нового с этим аккаунтом. */
  public abstract upsertByExternalId(
    channel: MessengerChannelKey,
    externalId: string,
    patch: MessengerUserPatch,
  ): Promise<MessengerUser>;

  /** Обновить профиль мессенджера и/или служебные маркеры существующего пользователя. */
  public abstract update(
    userId: number,
    channel: MessengerChannelKey,
    patch: MessengerUserPatch,
  ): Promise<MessengerUser>;
}

/**
 * Кнопка в сообщении — описана абстрактно, каждый мессенджер сам переводит её в формат своей
 * платформы (inline-клавиатура MAX, inline_keyboard Telegram, keyboard VK).
 */
export type MessengerButton =
  /** Открыть мини-приложение этого бота. */
  | { kind: 'open_app'; text: string }
  /** Обычная ссылка. */
  | { kind: 'link'; text: string; url: string }
  /** Кнопка с ответом боту: нажатие придёт в обработчик проекта с этим payload. */
  | { kind: 'callback'; text: string; payload: string };

export interface MessengerMessage {
  text: string;
  /** Ряды кнопок: внешний массив — строки клавиатуры, внутренний — кнопки в строке. */
  buttons?: MessengerButton[][];
}

/**
 * Сообщение бота, под которым пользователь нажал callback-кнопку, — чтобы ответить правкой этого
 * сообщения, а не новым. Собирается каналом мессенджера из контекста нажатия:
 * MaxMessengerChannel / TelegramMessengerChannel / VkMessengerChannel.callbackMessage(ctx).
 */
export interface MessengerCallbackMessage {
  readonly channel: MessengerChannelKey;

  /**
   * Когда бот отправил это сообщение; null — платформа не сообщила или запрос не удался.
   * Нужно, чтобы решать, можно ли затирать сообщение (например, вчерашнее — нельзя).
   */
  sentAt(): Promise<Date | null>;

  /**
   * Заменить текст и кнопки сообщения; buttons не переданы — кнопки убираются.
   * Бросает, если платформа отказала: сообщение удалено, слишком старое или текст не изменился —
   * вызывающий решает, слать ли вместо этого новое (MessengerChannel.send).
   */
  edit(message: MessengerMessage): Promise<void>;
}

/**
 * Контракт, который реализует модуль каждого мессенджера (max, telegram, vk).
 * Остальной код проекта (уведомления и т.п.) работает только с ним и не знает, какой
 * мессенджер внутри.
 */
export interface MessengerChannel {
  readonly channel: MessengerChannelKey;

  /**
   * Можно ли сейчас написать пользователю: аккаунт привязан и платформа разрешает боту писать
   * (у MAX — открыт чат с ботом, у Telegram — открыт чат или выдан write access и т.п.).
   * false — канал просто пропускается при рассылке, без записи об ошибке.
   */
  canDeliver(user: MessengerUser): boolean;

  /** Отправить сообщение. Бросает ошибку с понятным текстом, если платформа отказала. */
  send(user: MessengerUser, message: MessengerMessage): Promise<void>;
}
