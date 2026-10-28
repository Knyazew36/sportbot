import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { parsePayload } from '@/sync/sync-payload';
import { SyncPushService } from '@/sync/sync-push.service';
import { SyncOpContext, SyncOpOutcome } from '@/sync/sync-op.types';

import { SyncLimitationCreateDto } from './dto/sync/sync-limitation-create.dto';
import { LimitationService } from './limitation.service';

/** Ограничения по суставам с телефона (офлайн-синк, этап 5). */
@Injectable()
export class LimitationSyncService implements OnModuleInit {
  private readonly logger = new Logger(`🦴 ${LimitationSyncService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: SyncPushService,
    private readonly limitations: LimitationService,
  ) {}

  public onModuleInit() {
    this.push.register('limitation.create', (ctx) => this.create(ctx));
    this.push.register('limitation.delete', (ctx) => this.remove(ctx));
    this.logger.log('Операции ограничений подключены к синку: 2');
  }

  private async create({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const dto = await parsePayload(SyncLimitationCreateDto, op.payload);
    // Повтор: первый запрос уже завёл ограничение
    const existing = await this.prisma.limitation.findFirst({
      where: { clientId: op.clientId, userId },
      select: { id: true },
    });
    if (!existing)
      await this.limitations.addByUser(
        userId,
        dto.jointId,
        dto.endDate ?? null,
        op.clientId,
      );
    const row = await this.prisma.limitation.findFirst({
      where: { clientId: op.clientId, userId },
      select: { id: true },
    });
    return { status: 'applied', ids: row ? { [op.clientId]: row.id } : {} };
  }

  private async remove({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const cancelled = await this.limitations.cancelByClientId(
      userId,
      op.clientId,
    );
    return cancelled
      ? { status: 'applied' }
      : { status: 'skipped', reason: 'Ограничение уже снято' };
  }
}
