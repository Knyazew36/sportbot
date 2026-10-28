import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { parsePayload } from '@/sync/sync-payload';
import { SyncPushService } from '@/sync/sync-push.service';
import { SyncOpContext, SyncOpOutcome } from '@/sync/sync-op.types';

import { SyncPauseStartDto } from './dto/sync/sync-pause-start.dto';
import { PauseService } from './pause.service';

/** Пауза с телефона (офлайн-синк, этап 2): те же правила, что у кнопок приложения. */
@Injectable()
export class PauseSyncService implements OnModuleInit {
  private readonly logger = new Logger(`⏸ ${PauseSyncService.name}`);

  constructor(
    private readonly push: SyncPushService,
    private readonly pauses: PauseService,
  ) {}

  public onModuleInit() {
    this.push.register('pause.start', (ctx) => this.start(ctx));
    this.push.register('pause.end', (ctx) => this.end(ctx));
    this.logger.log('Операции паузы подключены к синку: 2');
  }

  private async start({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const dto = await parsePayload(SyncPauseStartDto, op.payload);
    await this.pauses.startByUser(userId, dto.endDate ?? null, op.clientId);
    return { status: 'applied' };
  }

  private async end({ userId }: SyncOpContext): Promise<SyncOpOutcome> {
    const ended = await this.pauses.endByUser(userId);
    return ended
      ? { status: 'applied' }
      : { status: 'skipped', reason: 'Паузы уже нет' };
  }
}
