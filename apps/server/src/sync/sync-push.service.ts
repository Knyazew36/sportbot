import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { Prisma } from '@/generated/prisma/client';

import { SyncOpDto } from './dto/sync-push.dto';
import { SyncOpResultDto, SyncOpStatus } from './dto/sync-push.response.dto';
import { SyncOpHandler, SyncOpOutcome } from './sync-op.types';

@Injectable()
export class SyncPushService {
  private readonly logger = new Logger(`🔄 ${SyncPushService.name}`);

  /** type → обработчик. Наполняется по этапам переноса (тренировка, день, программы…). */
  private readonly handlers = new Map<string, SyncOpHandler>();

  constructor(private readonly prisma: PrismaService) {}

  /** Подключить обработчик типа операции — вызывают модули сущностей при старте. */
  public register(type: string, handler: SyncOpHandler) {
    if (this.handlers.has(type)) {
      throw new Error(`Обработчик операции синка уже есть: ${type}`);
    }
    this.handlers.set(type, handler);
  }

  /** Операции применяются по одной в порядке пачки: следующая может опираться на предыдущую. */
  public async push(
    userId: number,
    ops: SyncOpDto[],
  ): Promise<SyncOpResultDto[]> {
    const done = await this.prisma.syncOp.findMany({
      where: { userId, opId: { in: ops.map((op) => op.opId) } },
    });
    const doneById = new Map(done.map((op) => [op.opId, op]));

    const results: SyncOpResultDto[] = [];
    for (const op of ops) {
      const prev = doneById.get(op.opId);
      if (prev) {
        results.push({
          opId: op.opId,
          status: prev.status as SyncOpStatus,
          reason: prev.reason,
          ids: (prev.result as Record<string, number> | null) ?? null,
        });
        continue;
      }
      results.push(await this.apply(userId, op));
    }

    const counts = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
    this.logger.log(
      `Push: userId=${userId}, операций=${ops.length}, повторов=${done.length}, ${JSON.stringify(counts)}`,
    );
    return results;
  }

  private async apply(userId: number, op: SyncOpDto): Promise<SyncOpResultDto> {
    const handler = this.handlers.get(op.type);
    if (!handler) {
      // Не пишем в журнал: после обновления сервера та же операция применится
      this.logger.warn(
        `Неизвестная операция: type=${op.type}, opId=${op.opId}, userId=${userId}`,
      );
      return {
        opId: op.opId,
        status: 'rejected',
        reason: 'Сервер пока не умеет применять это изменение',
        ids: null,
      };
    }

    const at = new Date(Math.min(Date.now(), +new Date(op.at)));
    try {
      const outcome: SyncOpOutcome = await handler({ userId, op, at }).catch(
        (error: unknown): SyncOpOutcome => {
          // Отказ сервиса (404, 400…) — ответ про эту операцию, а не сбой пачки
          if (error instanceof HttpException && error.getStatus() < 500) {
            return { status: 'rejected', reason: error.message };
          }
          throw error;
        },
      );
      const result: SyncOpResultDto = {
        opId: op.opId,
        status: outcome.status,
        reason: outcome.reason ?? null,
        ids: outcome.ids ?? null,
      };
      await this.prisma.syncOp.create({
        data: {
          opId: op.opId,
          userId,
          type: op.type,
          status: result.status,
          reason: result.reason,
          result: result.ids ?? Prisma.DbNull,
        },
      });
      if (result.status !== 'applied') {
        this.logger.warn(
          `Операция ${result.status}: type=${op.type}, opId=${op.opId}, userId=${userId}, причина=${result.reason}`,
        );
      }
      return result;
    } catch (error) {
      // Сбой сервера или базы — без записи в журнал: клиент повторит пачку
      this.logger.error(
        `Ошибка операции: type=${op.type}, opId=${op.opId}, userId=${userId}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}
