/**
 * Состояние чата пользователя с ботом — чистые функции над User.data (без БД).
 *
 * Зачем: MAX не даёт боту написать пользователю первым. Пока пользователь сам не открыл чат
 * (нажал «Начать», написал, нажал кнопку), любая отправка падает с dialog.not.found.
 * Поэтому факт «чат открыт» храним и проверяем перед отправкой.
 *
 * Где храним: маркеры в User.data, а не в maxData — maxData целиком перезаписывается
 * на каждый запрос из мини-приложения (MaxAuthStrategy.authenticate).
 *
 * - maxDialogStartedAt — чат точно открыт (bot_started / сообщение / клик по кнопке);
 * - maxDialogClosedAt — чат закрыт (bot_stopped / dialog_removed / dialog.not.found при отправке).
 *
 * Работу с БД поверх этих функций делает MaxDialogService.
 */
type UserData = Record<string, unknown>;

const asRecord = (data: unknown): UserData =>
  data && typeof data === 'object' && !Array.isArray(data)
    ? { ...(data as UserData) }
    : {};

export interface MaxDialogState {
  startedAt: string | null;
  closedAt: string | null;
}

export function getMaxDialogState(data: unknown): MaxDialogState {
  const record = asRecord(data);
  return {
    startedAt:
      typeof record.maxDialogStartedAt === 'string'
        ? record.maxDialogStartedAt
        : null,
    closedAt:
      typeof record.maxDialogClosedAt === 'string'
        ? record.maxDialogClosedAt
        : null,
  };
}

export function isMaxDialogOpen(data: unknown): boolean {
  return getMaxDialogState(data).startedAt !== null;
}

export function withMaxDialogStarted(data: unknown): Record<string, unknown> {
  const record = asRecord(data);
  delete record.maxDialogClosedAt;
  return { ...record, maxDialogStartedAt: new Date().toISOString() };
}

export function withMaxDialogClosed(data: unknown): Record<string, unknown> {
  const record = asRecord(data);
  delete record.maxDialogStartedAt;
  return { ...record, maxDialogClosedAt: new Date().toISOString() };
}
