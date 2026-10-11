import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ENTITY_EMOJI } from '@/common/utils';
import { VerificationCodeType } from '@/generated/prisma/client';
import { createHash, randomInt } from 'crypto';
import { PrismaService } from 'prisma/prisma.service';

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const CODE_MIN = 100000;
const CODE_MAX = 999999;

@Injectable()
export class VerificationCodeService {
  private readonly logger = new Logger(VerificationCodeService.name);

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

    this.logger.log(
      `${ENTITY_EMOJI.auth} Создан код userId=${userId} type=${type}`,
    );
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
        `${ENTITY_EMOJI.auth} Код недействителен/истёк userId=${userId} type=${type}`,
      );
      throw new BadRequestException('Код недействителен или истёк');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      this.logger.warn(
        `${ENTITY_EMOJI.auth} Превышены попытки userId=${userId} type=${type}`,
      );
      throw new BadRequestException(
        'Превышено число попыток. Запросите новый код',
      );
    }

    if (record.codeHash !== this.hashCode(code)) {
      await this.prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      this.logger.warn(
        `${ENTITY_EMOJI.auth} Неверный код userId=${userId} type=${type}`,
      );
      throw new BadRequestException('Неверный код');
    }

    await this.prisma.verificationCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    this.logger.log(
      `${ENTITY_EMOJI.auth} Код подтверждён userId=${userId} type=${type}`,
    );
  }

  private hashCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }
}
