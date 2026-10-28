import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { Prisma } from '@/generated/prisma/client';
import { UploadService } from '@/upload/upload.service';

import { StretchExclusionResponseDto } from './dto/stretch-exclusion.response.dto';

const EXCLUSION_INCLUDE = {
  stretch: { include: { muscles: { include: { muscle: true } } } },
} satisfies Prisma.StretchExclusionInclude;

type ExclusionFull = Prisma.StretchExclusionGetPayload<{
  include: typeof EXCLUSION_INCLUDE;
}>;

/** Исключённые растяжки: заминка их не предлагает, пока человек их не вернёт. */
@Injectable()
export class StretchExclusionService {
  private readonly logger = new Logger(`🙅 ${StretchExclusionService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadService,
  ) {}

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async list(userId: number): Promise<StretchExclusionResponseDto[]> {
    const items = await this.prisma.stretchExclusion.findMany({
      where: { userId },
      include: EXCLUSION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    this.logger.debug(
      `Список исключённых: userId=${userId}, всего=${items.length}`,
    );
    return items.map((item) => this.view(item));
  }

  public async find(
    userId: number,
    stretchId: number,
  ): Promise<StretchExclusionResponseDto> {
    const item = await this.prisma.stretchExclusion.findUnique({
      where: { userId_stretchId: { userId, stretchId } },
      include: EXCLUSION_INCLUDE,
    });
    if (!item) throw new NotFoundException('Растяжка не исключена.');
    return this.view(item);
  }

  // ── Запись ──────────────────────────────────────────────────────────────

  public async create(
    userId: number,
    stretchId: number,
  ): Promise<StretchExclusionResponseDto> {
    try {
      const item = await this.prisma.stretchExclusion.create({
        data: { userId, stretchId },
        include: EXCLUSION_INCLUDE,
      });
      this.logger.log(
        `Растяжка исключена: userId=${userId}, stretchId=${stretchId}`,
      );
      return this.view(item);
    } catch (error) {
      throw this.known(error);
    }
  }

  /** Исключить без ошибки на повтор: из заминки жмут и по растяжке, исключённой уже после сборки. */
  public async ensure(
    userId: number,
    stretchId: number,
    tx: Prisma.TransactionClient = this.prisma,
    /** clientId исключения с телефона: после синка у телефона та же строка */
    clientId?: string,
  ): Promise<void> {
    try {
      await tx.stretchExclusion.upsert({
        where: { userId_stretchId: { userId, stretchId } },
        create: { userId, stretchId, ...(clientId ? { clientId } : {}) },
        update: {},
      });
    } catch (error) {
      throw this.known(error);
    }
    this.logger.log(
      `Растяжка исключена из заминки: userId=${userId}, stretchId=${stretchId}`,
    );
  }

  public async remove(userId: number, stretchId: number): Promise<void> {
    try {
      await this.prisma.stretchExclusion.delete({
        where: { userId_stretchId: { userId, stretchId } },
      });
    } catch (error) {
      throw this.known(error);
    }
    this.logger.log(
      `Растяжка возвращена: userId=${userId}, stretchId=${stretchId}`,
    );
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private view(item: ExclusionFull): StretchExclusionResponseDto {
    return {
      stretchId: item.stretchId,
      name: item.stretch.name,
      imageUrl: this.uploads.toPublicUrl(item.stretch.imagePath),
      muscles: item.stretch.muscles.map((m) => m.muscle.name).join(' · '),
      createdAt: item.createdAt.toISOString(),
    };
  }

  private known(error: unknown): unknown {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return error;
    if (error.code === 'P2002')
      return new ConflictException('Растяжка уже исключена.');
    if (error.code === 'P2025')
      return new NotFoundException('Растяжка не исключена.');
    // Нарушенная связь на создании — такой растяжки нет
    if (error.code === 'P2003')
      return new NotFoundException('Растяжка не найдена.');
    this.logger.error(`Сбой записи исключения: ${error.code}`, error.stack);
    return error;
  }
}
