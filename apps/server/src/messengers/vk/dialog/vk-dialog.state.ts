/**
 * Может ли бот писать пользователю — чистые функции над User.data (без БД).
 *
 * Зачем: VK не даёт сообществу написать пользователю первым. Пока пользователь сам не написал
 * сообществу или не разрешил сообщения (а также после запрета), messages.send падает с ошибкой 901.
 * Поэтому факт «чат открыт» храним и проверяем перед отправкой.
 *
 * Где храним: маркеры в User.data, а не в vkData — vkData целиком перезаписывается
 * на каждый запрос из мини-приложения (VkAuthStrategy.authenticate).
 *
 * - vkDialogStartedAt — бот может писать (сообщение, клик по кнопке, message_allow, сверка с VK);
 * - vkDialogClosedAt — сообщения запрещены (message_deny / 901 при отправке).
 *
 * Работу с БД поверх этих функций делает VkDialogService.
 */
type UserData = Record<string, unknown>;

const asRecord = (data: unknown): UserData =>
  data && typeof data === 'object' && !Array.isArray(data)
    ? { ...(data as UserData) }
    : {};

export interface VkDialogState {
  startedAt: string | null;
  closedAt: string | null;
}

export function getVkDialogState(data: unknown): VkDialogState {
  const record = asRecord(data);
  return {
    startedAt:
      typeof record.vkDialogStartedAt === 'string'
        ? record.vkDialogStartedAt
        : null,
    closedAt:
      typeof record.vkDialogClosedAt === 'string'
        ? record.vkDialogClosedAt
        : null,
  };
}

export function isVkDialogOpen(data: unknown): boolean {
  return getVkDialogState(data).startedAt !== null;
}

export function withVkDialogStarted(data: unknown): Record<string, unknown> {
  const record = asRecord(data);
  delete record.vkDialogClosedAt;
  return { ...record, vkDialogStartedAt: new Date().toISOString() };
}

export function withVkDialogClosed(data: unknown): Record<string, unknown> {
  const record = asRecord(data);
  delete record.vkDialogStartedAt;
  return { ...record, vkDialogClosedAt: new Date().toISOString() };
}
