import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ENTITY_EMOJI } from '@/common/utils';
import { VerificationCodeType } from '@/generated/prisma/client';
import { createHash, randomInt } from 'crypto';
import { PrismaService } from 'prisma/prisma.service';

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const CODE_MIN = 100000;
const CODE_MAX = 999999;
// Использованные и протухшие коды нужны только для разбора свежих инцидентов
const RETENTION_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class VerificationCodeService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.auth} ${VerificationCodeService.name}`,
  );

  constructor(private readonly prisma: PrismaService) {}

  // Инвалидирует все ранее не использованные коды этого типа и выдаёт новый — активным остаётся только последний
  public async createCode(
    userId: number,
    type: VerificationCodeType,
  ): Promise<string> {
    await this.prisma.verificationCode.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });

    const code = randomInt(CODE_MIN, CODE_MAX + 1).toString();

    await this.prisma.verificationCode.create({
      data: {
        userId,
        type,
        codeHash: this.hashCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    this.logger.log(`Создан код userId=${userId} type=${type}`);
    return code;
  }

  // Бросает BadRequestException при неверном/истёкшем коде или превышении попыток; иначе помечает код использованным
  public async verifyCode(
    userId: number,
    type: VerificationCodeType,
    code: string,
  ): Promise<void> {
    const record = await this.prisma.verificationCode.findFirst({
      where: { userId, type, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt < new Date()) {
      this.logger.warn(
        `Код недействителен/истёк userId=${userId} type=${type}`,
      );
      throw new BadRequestException('Код недействителен или истёк');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      this.logger.warn(`Превышены попытки userId=${userId} type=${type}`);
      throw new BadRequestException(
        'Превышено число попыток. Запросите новый код',
      );
    }

    if (record.codeHash !== this.hashCode(code)) {
      await this.prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      this.logger.warn(`Неверный код userId=${userId} type=${type}`);
      throw new BadRequestException('Неверный код');
    }

    await this.prisma.verificationCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    this.logger.log(`Код подтверждён userId=${userId} type=${type}`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  public async cleanupExpiredCodes(): Promise<void> {
    try {
      const { count } = await this.prisma.verificationCode.deleteMany({
        where: { expiresAt: { lt: new Date(Date.now() - RETENTION_MS) } },
      });
      this.logger.log(`⏰ Очистка кодов подтверждения: удалено ${count}`);
    } catch (error) {
      this.logger.error(
        `Ошибка очистки кодов подтверждения: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private hashCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }
}
