import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RENDER_LIMITS } from '@sportbot/render-contract';
import { PrismaService } from 'prisma/prisma.service';

import { UploadService } from '@/upload/upload.service';

/** Готовые ролики живут сутки: файл удаляется, задача остаётся в истории без ссылки. */
@Injectable()
export class RenderCleanupService {
  private readonly logger = new Logger(`🎬 ${RenderCleanupService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  public async removeExpired(): Promise<void> {
    const before = new Date(
      Date.now() - RENDER_LIMITS.fileTtlHours * 60 * 60 * 1000,
    );
    const expired = await this.prisma.renderJob.findMany({
      where: { filePath: { not: null }, finishedAt: { lt: before } },
      select: { id: true, filePath: true },
    });
    for (const job of expired) {
      this.upload.deleteByRelativePath(job.filePath);
      await this.prisma.renderJob.update({
        where: { id: job.id },
        data: { filePath: null },
      });
    }
    if (expired.length)
      this.logger.log(`Удалено файлов рендера: ${expired.length}`);
  }
}
