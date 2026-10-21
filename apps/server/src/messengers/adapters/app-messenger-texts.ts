import { MessengerChannelKey } from '@/messengers';

/**
 * Тексты проекта для ботов всех мессенджеров (Telegram, VK, MAX) — в одном месте,
 * чтобы формулировки не разъезжались. Адаптеры каналов берут их отсюда; отличается
 * только то, что зависит от самого мессенджера (как не потерять уведомления).
 *
 * Название и ссылки берутся из env (APP_NAME, SITE_URL, FRONTEND_URL) при вызове, а не при
 * импорте: модуль загружается раньше, чем ConfigModule прочитает .env.
 */

const trimUrl = (name: string): string | undefined =>
  process.env[name]?.trim().replace(/\/+$/, '') || undefined;

const appName = (): string => process.env.APP_NAME?.trim() || 'Спортбот';

/** Что пользователю нельзя делать, чтобы уведомления продолжали приходить. */
const KEEP_NOTIFICATIONS_HINT: Record<MessengerChannelKey, string> = {
  TELEGRAM: 'не блокируй бота',
  VK: 'не запрещай сообщения от сообщества',
  MAX: 'не закрывай чат',
};

// Голос бренда (packages/brand/BRAND.md): спокойный напарник на «ты», коротко, без хайпа
export const welcomeText = (channel: MessengerChannelKey): string =>
  `Привет! Я ${appName()} — веду твои тренировки в зале и дома.

Как это работает:
1. Открой приложение и выбери программу — готовую или свою.
2. В тренировочные дни утром напишу, что сегодня по плану.
3. В зале отмечай подходы — таймер отдыха подскажет, когда дальше.
4. Вечером спрошу, как прошло. Серия посчитается сама.

Напоминания приходят сюда — ${KEEP_NOTIFICATIONS_HINT[channel]}, иначе я замолчу.`;

/**
 * Картинка к приветствию: лежит во фронте (apps/frontend/public/brand), исходник — packages/brand/telegram.
 * Без FRONTEND_URL на https Telegram её не скачает — приветствие уйдёт текстом.
 */
export const welcomePhotoUrl = (): string | null => {
  const frontendUrl = trimUrl('FRONTEND_URL');
  return frontendUrl?.startsWith('https://')
    ? `${frontendUrl}/brand/welcome-1280x720.png`
    : null;
};

/** Описание в профиле бота и в пустом чате до «Старт» (лимиты Telegram: 120 и 512 символов). */
export const BOT_SHORT_DESCRIPTION =
  'Напарник по тренировкам: план на сегодня, подходы, таймер отдыха и серия. Тренировка не теряется.';

export const BOT_DESCRIPTION = `Веду твои тренировки в зале и дома.

— Утром скажу, что сегодня по плану
— В зале: подходы, веса и таймер отдыха
— Вечером спрошу, как прошло, и отмечу тренировку
— Серия, рекорды и графики весов — в приложении
— Друзья видят, что ты сегодня тоже потренировался

Программу возьми готовую или собери свою. Жми «Старт» — начнём.`;

/** Кнопки-ссылки приветствия; незаданные адреса просто не показываются. */
export const welcomeLinks = (): { text: string; url: string }[] => {
  const links: { text: string; url: string }[] = [];
  const siteUrl = trimUrl('SITE_URL');
  const frontendUrl = trimUrl('FRONTEND_URL');
  if (siteUrl) links.push({ text: '🌐 Сайт', url: siteUrl });
  if (frontendUrl && frontendUrl !== siteUrl)
    links.push({ text: '💻 Веб-версия', url: frontendUrl });
  return links;
};

const CHANNEL_TITLE: Record<MessengerChannelKey, string> = {
  TELEGRAM: 'Telegram',
  VK: 'VK',
  MAX: 'MAX',
};

export const LINK_ERRORS = {
  targetTaken: (channel: MessengerChannelKey): string =>
    `Веб-аккаунт не найден или к нему уже привязан другой ${CHANNEL_TITLE[channel]}-аккаунт`,
  accountTaken: (channel: MessengerChannelKey): string =>
    `Этот ${CHANNEL_TITLE[channel]}-аккаунт уже привязан к другому пользователю`,
  hasSportData: (channel: MessengerChannelKey): string =>
    `В этом ${CHANNEL_TITLE[channel]} уже есть аккаунт бота с данными — привяжи его в боте: Настройки → Мессенджеры`,
};
