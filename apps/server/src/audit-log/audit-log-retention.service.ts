import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ENTITY_EMOJI } from '@/common/utils';
import { PrismaService } from 'prisma/prisma.service';

// Аудит-лог не для комплаенса, а для оперативного разбора — 90 дней достаточно,
// дальше строки только раздувают таблицу (payload — JSON тела запроса).
const RETENTION_DAYS = 90;

@Injectable()
export class AuditLogRetentionService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.auditLog} ${AuditLogRetentionService.name}`,
  );

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  public async cleanupExpiredEntries() {
    this.logger.log(
      `⏰ Тик крона cleanupExpiredEntries: ${new Date().toISOString()}`,
    );

    try {
      const { deletedCount } = await this.cleanupExpiredEntriesNow();
      this.logger.log(
        `🧹 Очистка аудит-лога завершена: удалено записей старше ${RETENTION_DAYS} дней: ${deletedCount}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Ошибка при очистке аудит-лога: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /** Ручной прогон очистки — вынесен отдельно, чтобы вызывать вне крона. */
  public async cleanupExpiredEntriesNow(): Promise<{ deletedCount: number }> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const { count } = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    return { deletedCount: count };
  }
}
