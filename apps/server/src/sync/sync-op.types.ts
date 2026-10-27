import { SyncOpDto } from './dto/sync-push.dto';
import { SyncOpStatus } from './dto/sync-push.response.dto';

export type SyncOpContext = {
  userId: number;
  op: SyncOpDto;
  /** Время действия с телефона, не позже времени сервера. */
  at: Date;
};

export type SyncOpOutcome = {
  status: SyncOpStatus;
  reason?: string;
  /** Серверные id созданных строк: { clientId: id } */
  ids?: Record<string, number>;
};

/**
 * Обработчик одного типа операции. Должен быть идемпотентным по clientId:
 * журнал SyncOp пишется после применения, и сбой между ними повторит операцию.
 */
export type SyncOpHandler = (ctx: SyncOpContext) => Promise<SyncOpOutcome>;
