import { TELEGRAM_START_PAYLOAD } from '../telegram.constants';

export type TelegramStartIntent =
  { kind: 'login'; token: string } | { kind: 'link'; token: string };

/**
 * Ссылка, открывающая ЧАТ с ботом (не мини-приложение) с payload. Бот получает его как аргумент
 * /start и сразу отвечает кнопками — подтверждение входа/привязки происходит в чате, и заодно
 * бот получает право писать пользователю (уведомления).
 */
export function buildTelegramStartLink(
  botName: string,
  payload: string,
): string {
  return `https://t.me/${botName}?start=${encodeURIComponent(payload)}`;
}

/** Разобрать payload из /start. null — payload пустой или не наш (например, рекламная метка). */
export function parseTelegramStartPayload(
  payload: string | null | undefined,
): TelegramStartIntent | null {
  if (!payload) return null;
  if (payload.startsWith(TELEGRAM_START_PAYLOAD.login)) {
    const token = payload.slice(TELEGRAM_START_PAYLOAD.login.length);
    return token ? { kind: 'login', token } : null;
  }
  if (payload.startsWith(TELEGRAM_START_PAYLOAD.link)) {
    const token = payload.slice(TELEGRAM_START_PAYLOAD.link.length);
    return token ? { kind: 'link', token } : null;
  }
  return null;
}
