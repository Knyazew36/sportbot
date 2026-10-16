import { SportProfile, User } from '@/generated/prisma/client';
import {
  italic,
  MessengerButton,
  MessengerMessage,
  MessengerSendResult,
  separateItalic,
} from '@/messengers';

export type BotChannelKey = 'TELEGRAM' | 'MAX';

export type BotUser = User & { sportProfile: SportProfile | null };

export const BOT_CHANNEL_TITLE: Record<BotChannelKey, string> = {
  TELEGRAM: 'Telegram',
  MAX: 'MAX',
};

/** Куда бот пишет сам, пока пользователь с двумя мессенджерами не выбрал. */
export const DEFAULT_NOTIFY_CHANNEL: BotChannelKey = 'TELEGRAM';

/** Второй мессенджер бота. */
export const otherBotChannel = (channel: BotChannelKey): BotChannelKey =>
  channel === 'TELEGRAM' ? 'MAX' : 'TELEGRAM';

/** Диплинк `…?start=<payload>` в бота этого мессенджера; undefined — бот в нём не подключён. */
export function botStartLink(
  channel: BotChannelKey,
  payload: string,
): string | undefined {
  const name = (
    channel === 'TELEGRAM' ? process.env.TG_BOT_NAME : process.env.MAX_BOT_NAME
  )?.trim();
  if (!name) return undefined;
  return channel === 'TELEGRAM'
    ? `https://t.me/${name}?start=${payload}`
    : `https://max.ru/${name}?start=${payload}`;
}

/**
 * Ссылка на мини-приложение бота сразу на экран startParam; undefined — бот в мессенджере не подключён.
 * Для пересылаемых сообщений: кнопка open_app в чужом чате не работает, обычная ссылка — да.
 */
export function botAppLink(
  channel: BotChannelKey,
  startParam: string,
): string | undefined {
  const name = (
    channel === 'TELEGRAM' ? process.env.TG_BOT_NAME : process.env.MAX_BOT_NAME
  )?.trim();
  if (!name) return undefined;
  return channel === 'TELEGRAM'
    ? `https://t.me/${name}?startapp=${startParam}`
    : `https://max.ru/${name}?startapp=${startParam}`;
}

/** Файл, присланный боту (импорт справочника от администратора). */
export interface BotDocument {
  fileName: string;
  size: number;
  download(): Promise<Buffer>;
}

/** Чего бот ждёт от пользователя: ключ ожидания и накопленный ввод. */
export interface BotSessionState {
  state: string;
  data: Record<string, any>;
}

/**
 * Единый объект события для кода фич: обработчики не знают, какой мессенджер внутри.
 * Собирается в AppTelegramAdapter / AppMaxAdapter.
 */
export interface BotContext {
  channel: BotChannelKey;
  user: BotUser;
  /** Спортивный профиль; роутер гарантирует его наличие до вызова обработчика. */
  profile: SportProfile;
  kind: 'command' | 'callback' | 'text' | 'document';
  /** Имя команды без слэша. */
  command?: string;
  /** Payload команды /start (диплинк). */
  startPayload?: string;
  /** Payload нажатой кнопки. */
  payload?: string;
  text?: string;
  document?: BotDocument;
  /** Новое сообщение. */
  reply(message: MessengerMessage): Promise<MessengerSendResult>;
  /** Правка сообщения с нажатой кнопкой; платформа отказала или это не кнопка — новое сообщение. */
  edit(message: MessengerMessage): Promise<void>;
  /** Всплывашка у кнопки; вне нажатия кнопки — обычное сообщение. */
  toast(text: string): Promise<void>;
  /**
   * Удалить сообщение с нажатой кнопкой. @returns false — это не кнопка или платформа отказала
   * (Telegram не даёт удалять сообщения старше 48 часов).
   */
  remove(): Promise<boolean>;
}

/** Обработчик фичи (`*.bot.ts`). Регистрируется декоратором @BotHandler. */
export interface BotFeature {
  onCommand?(ctx: BotContext, command: string): Promise<void>;
  onStart?(ctx: BotContext, payload: string): Promise<void>;
  onCallback?(
    ctx: BotContext,
    prefix: string,
    action: string,
    args: string[],
  ): Promise<void>;
  onText?(ctx: BotContext, session: BotSessionState): Promise<void>;
  onDocument?(ctx: BotContext): Promise<void>;
}

// ── Сборка сообщений ──────────────────────────────────────────────────────

export const btn = (text: string, payload: string): MessengerButton => ({
  kind: 'callback',
  text,
  payload,
});

/**
 * Экраны Mini App для кнопок «Открыть в приложении» (frontend-tz, 5.1). Значение уходит в startapp
 * и разбирается фронтом (shared/miniapp/start-route.ts) — меняется только парой.
 */
export const APP_SCREEN = {
  today: 'today',
  stats: 'stats',
  cooldown: (workoutId: number) => `cd_${workoutId}`,
  friend: (userId: number) => `fr_${userId}`,
  program: (programId: number) => `pr_${programId}`,
  templates: 'tpl',
  mine: 'mine',
  request: (requestId: number) => `md_${requestId}`,
  complaint: (complaintId: number) => `cp_${complaintId}`,
  programReview: (programId: number) => `pv_${programId}`,
  result: (shareToken: string) => `ws_${shareToken}`,
} as const;

/** Кнопка мини-приложения, сразу на нужный экран. Кнопки бота при этом остаются: всё можно и в чате. */
export const appBtn = (
  startParam?: string,
  text = '📱 Открыть в приложении',
): MessengerButton => ({ kind: 'open_app', text, startParam });

export const linkBtn = (text: string, url: string): MessengerButton => ({
  kind: 'link',
  text,
  url,
});

/** Сообщение. Подсказки (hint) отделяются от основного текста пустой строкой. */
export const msg = (
  text: string,
  buttons?: MessengerButton[][],
): MessengerMessage => ({ text: separateItalic(text), buttons });

/** Разложить кнопки по рядам фиксированной ширины. */
export function grid(
  buttons: MessengerButton[],
  perRow: number,
): MessengerButton[][] {
  const rows: MessengerButton[][] = [];
  for (let i = 0; i < buttons.length; i += perRow)
    rows.push(buttons.slice(i, i + perRow));
  return rows;
}

/** Подпись кнопки: мессенджеры режут длинный текст некрасиво — режем сами. */
export const cut = (text: string, max = 40): string =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/**
 * Подсказка пользователю — что нажать или как ввести. Всегда курсивом: так инструкция
 * отличается от содержания сообщения.
 */
export const hint = (text: string): string => italic(text);

export const BACK_TO_MENU = btn('🏠 Меню', 'mn:main');

/** Администратор определяется по env ADMIN_TELEGRAM_ID / ADMIN_MAX_ID. */
export type AdminIdentity = Pick<
  User,
  'telegramId' | 'maxId' | 'telegramData' | 'maxData'
>;

/** Ник из env: без «@», в нижнем регистре; пусто — не задан. */
const envUsername = (name: string): string =>
  (process.env[name] ?? '').trim().replace(/^@/, '').toLowerCase();

/** Ник пользователя из профиля мессенджера (обновляется с каждым его сообщением боту). */
const profileUsername = (data: unknown): string => {
  const username = (data as { username?: unknown } | null)?.username;
  return typeof username === 'string' ? username.toLowerCase() : '';
};

/** Задан ли администратор хоть одним способом. */
export function adminConfigured(): boolean {
  return [
    process.env.ADMIN_TELEGRAM_ID,
    process.env.ADMIN_MAX_ID,
    process.env.ADMIN_TELEGRAM_USERNAME,
    process.env.ADMIN_MAX_USERNAME,
  ].some((value) => !!value?.trim());
}

/**
 * Администратор определяется по env: нику (ADMIN_TELEGRAM_USERNAME / ADMIN_MAX_USERNAME)
 * или числовому id (ADMIN_TELEGRAM_ID / ADMIN_MAX_ID). Ник удобнее, id надёжнее: ник можно
 * сменить, и тогда права перейдут к тому, кто его займёт.
 */
export function isAdmin(user: AdminIdentity): boolean {
  const tgId = process.env.ADMIN_TELEGRAM_ID?.trim();
  const maxId = process.env.ADMIN_MAX_ID?.trim();
  const tgName = envUsername('ADMIN_TELEGRAM_USERNAME');
  const maxName = envUsername('ADMIN_MAX_USERNAME');
  return (
    (!!tgId && user.telegramId === tgId) ||
    (!!maxId && user.maxId === maxId) ||
    // Ник сверяется только у аккаунта этого же мессенджера
    (!!tgName &&
      !!user.telegramId &&
      profileUsername(user.telegramData) === tgName) ||
    (!!maxName && !!user.maxId && profileUsername(user.maxData) === maxName)
  );
}

const DIGIT_EMOJI = [
  '0️⃣',
  '1️⃣',
  '2️⃣',
  '3️⃣',
  '4️⃣',
  '5️⃣',
  '6️⃣',
  '7️⃣',
  '8️⃣',
  '9️⃣',
];

/**
 * Номер пункта смайлом: 3 → 3️⃣, 10 → 🔟, 12 → 1️⃣2️⃣. Один и тот же смайл стоит в пункте списка
 * и на кнопке под ним — так видно, какая кнопка к какому пункту.
 */
export function numEmoji(n: number): string {
  if (n === 10) return '🔟';
  return String(n)
    .split('')
    .map((digit) => DIGIT_EMOJI[Number(digit)])
    .join('');
}

/** Склонение: plural(5, 'упражнение', 'упражнения', 'упражнений'). */
export function plural(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
