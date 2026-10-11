import { MAX_START_PAYLOAD } from '../max.constants';

export type MaxStartIntent =
  { kind: 'login'; token: string } | { kind: 'link'; token: string };

/**
 * Ссылка, открывающая ЧАТ с ботом (не мини-приложение) с payload. Бот получает payload
 * в событии bot_started и может сразу ответить кнопками — так подтверждение входа/привязки
 * происходит в чате, и заодно чат открывается для уведомлений.
 */
export function buildMaxStartLink(botName: string, payload: string): string {
  return `https://max.ru/${botName}?start=${encodeURIComponent(payload)}`;
}

/** Разобрать payload из bot_started. null — payload пустой или не наш (например, рекламная метка). */
export function parseMaxStartPayload(
  payload: string | null | undefined,
): MaxStartIntent | null {
  if (!payload) return null;
  if (payload.startsWith(MAX_START_PAYLOAD.login)) {
    const token = payload.slice(MAX_START_PAYLOAD.login.length);
    return token ? { kind: 'login', token } : null;
  }
  if (payload.startsWith(MAX_START_PAYLOAD.link)) {
    const token = payload.slice(MAX_START_PAYLOAD.link.length);
    return token ? { kind: 'link', token } : null;
  }
  return null;
}
