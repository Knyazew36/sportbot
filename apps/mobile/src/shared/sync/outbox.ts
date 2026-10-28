import { count, max } from 'drizzle-orm';

import { newClientId } from '@sportbot/api/entities/workout';

import type { LocalDb } from '@/shared/db/client';
import { META_KEYS, readMeta, writeMeta } from '@/shared/db/meta';
import { outbox } from '@/shared/db/schema';

/** Транзакция локальной правки: изменение строк и операция для сервера — вместе или никак */
export type LocalTx = Parameters<Parameters<LocalDb['transaction']>[0]>[0];

export type OpInput = {
  type: string;
  /** Сущность строки clientId — для журнала и разбора отказов */
  entity: string;
  clientId: string;
  payload: Record<string, unknown>;
  /** Время действия; по умолчанию — сейчас */
  at?: string;
  /** Ещё строки, которые создаёт или меняет операция (упражнения при старте) */
  touched?: string[];
};

/** Поставить операцию в конец очереди. Порядок важен: подход не уйдёт раньше старта своей тренировки */
export const enqueue = (tx: LocalTx, op: OpInput) => {
  const last = tx.select({ seq: max(outbox.seq) }).from(outbox).get()?.seq ?? 0;
  tx.insert(outbox)
    .values({
      opId: newClientId(),
      seq: last + 1,
      type: op.type,
      entity: op.entity,
      clientId: op.clientId,
      payload: op.payload,
      at: op.at ?? new Date().toISOString(),
      touched: op.touched ?? [],
    })
    .run();
};

/**
 * id экрана для строки, созданной на телефоне: отрицательный, чтобы не встретиться с серверным.
 * Остаётся за строкой и после push — открытый маршрут с ним не ломается
 */
export const nextLocalId = (tx: LocalTx): number => {
  const next = Number(readMeta(tx, META_KEYS.localSeq) ?? 0) - 1;
  writeMeta(tx, META_KEYS.localSeq, String(next));
  return next;
};

export const pendingCount = (db: Pick<LocalDb, 'select'>): number =>
  db.select({ n: count() }).from(outbox).get()?.n ?? 0;
