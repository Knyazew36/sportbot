import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { parsePayload } from '@/sync/sync-payload';
import { SyncPushService } from '@/sync/sync-push.service';
import { SyncOpContext, SyncOpOutcome } from '@/sync/sync-op.types';

import { SyncStretchExclusionDto } from './dto/sync/sync-stretch-exclusion.dto';
import { StretchExclusionService } from './stretch-exclusion.service';

/** Исключённые растяжки с телефона (офлайн-синк, этап 5): повтор и уже исключённая — не ошибка. */
@Injectable()
export class StretchExclusionSyncService implements OnModuleInit {
  private readonly logger = new Logger(`🙅 ${StretchExclusionSyncService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: SyncPushService,
    private readonly exclusions: StretchExclusionService,
  ) {}

  public onModuleInit() {
    this.push.register('stretchExclusion.create', (ctx) => this.create(ctx));
    this.push.register('stretchExclusion.delete', (ctx) => this.remove(ctx));
    this.logger.log('Операции исключённых растяжек подключены к синку: 2');
  }

  private async create({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const { stretchId } = await parsePayload(SyncStretchExclusionDto, op.payload);
    await this.exclusions.ensure(userId, stretchId, this.prisma, op.clientId);
    return { status: 'applied' };
  }

  private async remove({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const { stretchId } = await parsePayload(SyncStretchExclusionDto, op.payload);
    const found = await this.prisma.stretchExclusion.findUnique({
      where: { userId_stretchId: { userId, stretchId } },
      select: { stretchId: true },
    });
    if (!found) return { status: 'skipped', reason: 'Растяжка уже возвращена' };
    await this.exclusions.remove(userId, stretchId);
    return { status: 'applied' };
  }
}
