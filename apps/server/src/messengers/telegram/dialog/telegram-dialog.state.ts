/**
 * Может ли бот писать пользователю — чистые функции над User.data (без БД).
 *
 * Зачем: Telegram не даёт боту написать пользователю первым. Пока пользователь сам не нажал
 * «Start» (или заблокировал бота), любая отправка падает с 403 / chat not found. Поэтому факт
 * «чат открыт» храним и проверяем перед отправкой.
 *
 * Где храним: маркеры в User.data, а не в telegramData — telegramData целиком перезаписывается
 * на каждый запрос из мини-приложения (TelegramAuthStrategy.authenticate).
 *
 * - telegramDialogStartedAt — бот может писать (/start, сообщение, клик по кнопке, разблокировка);
 * - telegramDialogClosedAt — бот заблокирован (my_chat_member kicked / 403 при отправке).
 *
 * Работу с БД поверх этих функций делает TelegramDialogService.
 */
type UserData = Record<string, unknown>;

const asRecord = (data: unknown): UserData =>
  data && typeof data === 'object' && !Array.isArray(data)
    ? { ...(data as UserData) }
    : {};

export interface TelegramDialogState {
  startedAt: string | null;
  closedAt: string | null;
}

export function getTelegramDialogState(data: unknown): TelegramDialogState {
  const record = asRecord(data);
  return {
    startedAt:
      typeof record.telegramDialogStartedAt === 'string'
        ? record.telegramDialogStartedAt
        : null,
    closedAt:
      typeof record.telegramDialogClosedAt === 'string'
        ? record.telegramDialogClosedAt
        : null,
  };
}

export function isTelegramDialogOpen(data: unknown): boolean {
  return getTelegramDialogState(data).startedAt !== null;
}

export function withTelegramDialogStarted(
  data: unknown,
): Record<string, unknown> {
  const record = asRecord(data);
  delete record.telegramDialogClosedAt;
  return {
    ...record,
    telegramDialogStartedAt: new Date().toISOString(),
  };
}

export function withTelegramDialogClosed(
  data: unknown,
): Record<string, unknown> {
  const record = asRecord(data);
  delete record.telegramDialogStartedAt;
  return {
    ...record,
    telegramDialogClosedAt: new Date().toISOString(),
  };
}
