import { VK_REF_PAYLOAD } from '../vk.constants';

export type VkStartIntent =
  { kind: 'login'; token: string } | { kind: 'link'; token: string };

/**
 * Ссылка, открывающая ЧАТ с сообществом (не мини-приложение) с ref. VK отдаёт ref боту вместе
 * с первым сообщением после перехода (кнопка «Начать»), бот сразу отвечает кнопками —
 * подтверждение входа/привязки происходит в чате, и заодно сообщество получает право писать
 * пользователю (уведомления).
 */
export function buildVkStartLink(groupId: number, payload: string): string {
  return `https://vk.me/club${groupId}?ref=${encodeURIComponent(payload)}`;
}

/** Разобрать ref из сообщения. null — ref пустой или не наш (например, рекламная метка). */
export function parseVkRef(
  ref: string | null | undefined,
): VkStartIntent | null {
  if (!ref) return null;
  if (ref.startsWith(VK_REF_PAYLOAD.login)) {
    const token = ref.slice(VK_REF_PAYLOAD.login.length);
    return token ? { kind: 'login', token } : null;
  }
  if (ref.startsWith(VK_REF_PAYLOAD.link)) {
    const token = ref.slice(VK_REF_PAYLOAD.link.length);
    return token ? { kind: 'link', token } : null;
  }
  return null;
}
