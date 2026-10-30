import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { parsePayload } from '@/sync/sync-payload';
import { SyncPushService } from '@/sync/sync-push.service';
import { SyncOpContext, SyncOpOutcome } from '@/sync/sync-op.types';

import { SyncStretchSessionFinishDto } from './dto/sync/sync-stretch-session-finish.dto';
import { SyncStretchSessionStartDto } from './dto/sync/sync-stretch-session-start.dto';
import { StretchSessionService } from './stretch-session.service';

/** Занятия растяжкой с телефона: повтор операции и уже удалённое занятие — не ошибка. */
@Injectable()
export class StretchSessionSyncService implements OnModuleInit {
  private readonly logger = new Logger(`🧘 ${StretchSessionSyncService.name}`);

  constructor(
    private readonly push: SyncPushService,
    private readonly sessions: StretchSessionService,
  ) {}

  public onModuleInit() {
    this.push.register('stretchSession.start', (ctx) => this.start(ctx));
    this.push.register('stretchSession.finish', (ctx) => this.finish(ctx));
    this.push.register('stretchSession.delete', (ctx) => this.remove(ctx));
    this.logger.log('Операции занятий растяжкой подключены к синку: 3');
  }

  private async start({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const dto = await parsePayload(SyncStretchSessionStartDto, op.payload);
    const id = await this.sessions.startFromClient(userId, op.clientId, dto);
    return { status: 'applied', ids: { [op.clientId]: id } };
  }

  private async finish({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const dto = await parsePayload(SyncStretchSessionFinishDto, op.payload);
    const found = await this.sessions.finishFromClient(
      userId,
      op.clientId,
      dto.finishedAt,
    );
    return found
      ? { status: 'applied' }
      : { status: 'skipped', reason: 'Занятие уже удалено' };
  }

  private async remove({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const found = await this.sessions.removeFromClient(userId, op.clientId);
    return found
      ? { status: 'applied' }
      : { status: 'skipped', reason: 'Занятие уже удалено' };
  }
}
