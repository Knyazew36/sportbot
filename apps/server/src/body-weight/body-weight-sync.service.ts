import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { parsePayload } from '@/sync/sync-payload';
import { SyncPushService } from '@/sync/sync-push.service';
import { SyncOpContext, SyncOpOutcome } from '@/sync/sync-op.types';

import { BodyWeightService } from './body-weight.service';
import { SyncBodyWeightDto } from './dto/sync/sync-body-weight.dto';

/** Вес тела с телефона (офлайн-синк, этап 5). */
@Injectable()
export class BodyWeightSyncService implements OnModuleInit {
  private readonly logger = new Logger(`⚖️ ${BodyWeightSyncService.name}`);

  constructor(
    private readonly push: SyncPushService,
    private readonly weights: BodyWeightService,
  ) {}

  public onModuleInit() {
    this.push.register('bodyWeight.add', (ctx) => this.add(ctx));
    this.logger.log('Операции веса тела подключены к синку: 1');
  }

  /**
   * Запись за день уже была со своим clientId — значение заменено, а телефон уберёт свою копию:
   * ids без его clientId
   */
  private async add({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const dto = await parsePayload(SyncBodyWeightDto, op.payload);
    const row = await this.weights.recordFromClient(
      userId,
      new Date(`${dto.date}T00:00:00.000Z`),
      dto.value,
      op.clientId,
    );
    return {
      status: 'applied',
      ids: row.clientId === op.clientId ? { [op.clientId]: row.id } : {},
    };
  }
}
