import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  COMPOSITIONS,
  isCompositionId,
  RENDER_FORMATS,
  type RenderFormat,
} from '@sportbot/render-contract';
import * as path from 'path';
import { PrismaService } from 'prisma/prisma.service';

import { BotSender } from '@/bot';
import { RenderJob } from '@/generated/prisma/client';
import { renderFileName } from '@/render/render.files';
import { UploadService } from '@/upload/upload.service';

/**
 * Доставка готовых роликов в чат. Живёт в основном процессе: только тут запущены боты, воркер
 * рендера их не поднимает (второй polling того же бота Telegram отклонит). О рендере ничего не
 * знает — смотрит на задачи в статусе DONE.
 */
@Injectable()
export class RenderDeliveryService {
  private readonly logger = new Logger(`📤 ${RenderDeliveryService.name}`);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sender: BotSender,
    private readonly upload: UploadService,
  ) {}

  @Interval(5000)
  public async deliverReady(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const ready = await this.prisma.renderJob.findMany({
        where: {
          status: 'DONE',
          delivery: 'CHAT',
          deliveredAt: null,
          filePath: { not: null },
        },
        orderBy: { finishedAt: 'asc' },
        take: 10,
      });
      for (const job of ready) await this.deliver(job);
    } finally {
      this.running = false;
    }
  }

  private async deliver(job: RenderJob): Promise<void> {
    // Захват задачи: при нескольких экземплярах API файл уйдёт один раз
    const { count } = await this.prisma.renderJob.updateMany({
      where: { id: job.id, deliveredAt: null },
      data: { deliveredAt: new Date() },
    });
    if (!count || !job.filePath || !job.channel) return;

    const user = await this.prisma.user.findUnique({
      where: { id: job.userId },
    });
    if (!user) return;
    try {
      await this.sender.sendVia(job.channel, user, {
        text: this.caption(job),
        file: {
          path: path.join(this.upload.uploadRoot, job.filePath),
          name: renderFileName(job),
        },
      });
      this.logger.log(`Ролик #${job.id} отправлен в ${job.channel}`);
    } catch (error) {
      this.logger.warn(
        `Ролик #${job.id} не доставлен в ${job.channel}: ${(error as Error).message}`,
      );
      await this.prisma.renderJob.update({
        where: { id: job.id },
        data: {
          error:
            'Бот не смог прислать файл в чат. Скачай его в приложении — он хранится сутки.',
        },
      });
    }
  }

  private caption(job: RenderJob): string {
    const title = isCompositionId(job.compositionId)
      ? COMPOSITIONS[job.compositionId].title
      : 'Ролик';
    const spec = RENDER_FORMATS[job.format as RenderFormat];
    return spec?.background
      ? `${title} готова. ${spec.hint}.`
      : `${title} готова.`;
  }
}
