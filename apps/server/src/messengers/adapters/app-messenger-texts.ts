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

/** Что пользователю нельзя делать, чтобы уведомления продолжали приходить. */
const KEEP_NOTIFICATIONS_HINT: Record<MessengerChannelKey, string> = {
  TELEGRAM: 'не блокируйте бота',
  VK: 'не запрещайте сообщения от сообщества',
  MAX: 'не закрывайте чат',
};

export const welcomeText = (channel: MessengerChannelKey): string =>
  `👋 Добро пожаловать в ${process.env.APP_NAME?.trim() || 'приложение'}!

🚀 Приложение открывается по кнопке ниже
🔔 Сюда же будут приходить уведомления — ${KEEP_NOTIFICATIONS_HINT[channel]}, иначе они перестанут приходить`;

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
};
