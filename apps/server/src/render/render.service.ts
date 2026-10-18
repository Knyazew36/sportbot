import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  COMPOSITIONS,
  RENDER_FORMATS,
  RENDER_LIMITS,
  type RenderFormat,
} from '@sportbot/render-contract';
import { PrismaService } from 'prisma/prisma.service';

import { BotChannel, RenderJob } from '@/generated/prisma/client';
import { UploadService } from '@/upload/upload.service';

import { CreateRenderJobDto } from './dto/create-render-job.dto';
import { RenderJobResponseDto } from './dto/render-job.response.dto';
import { renderFileName } from './render.files';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 422 в формате ValidationPipe (main.ts): фронт разложит ошибки props под поля формы. */
const fieldError = (fields: Record<string, string[]>) =>
  new UnprocessableEntityException({
    message: Object.values(fields).flat(),
    errors: fields,
  });

/**
 * Очередь рендера: проверяет заказ по контракту композиции и ставит задачу. Сам не рендерит и не
 * доставляет — это render-worker (отдельный процесс) и render-delivery.
 */
@Injectable()
export class RenderService {
  private readonly logger = new Logger(`🎬 ${RenderService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
  ) {}

  public async create(
    userId: number,
    channel: BotChannel | null,
    dto: CreateRenderJobDto,
  ): Promise<RenderJobResponseDto> {
    const composition = COMPOSITIONS[dto.compositionId];
    const format: RenderFormat = dto.format ?? composition.formats[0];
    if (!(composition.formats as readonly RenderFormat[]).includes(format))
      throw new BadRequestException('Этот ролик в таком формате не делаем');
    if (dto.delivery === 'CHAT' && !RENDER_FORMATS[format].chat)
      throw new BadRequestException(
        'Файл слишком тяжёлый для чата — выбери «Скачать»',
      );

    const parsed = composition.schema.safeParse(dto.props);
    if (!parsed.success) {
      const fields: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        // Ключ — путь внутри props: форма на фронте редактирует props напрямую
        const key = issue.path.join('.');
        (fields[key] ??= []).push(issue.message);
      }
      throw fieldError(fields);
    }

    // Повторное нажатие той же кнопки: файл уже есть или вот-вот будет — второй раз не рендерим
    if (dto.delivery === 'DOWNLOAD') {
      const same = await this.prisma.renderJob.findFirst({
        where: {
          userId,
          compositionId: dto.compositionId,
          format,
          delivery: 'DOWNLOAD',
          props: { equals: parsed.data },
          OR: [
            { status: { in: ['QUEUED', 'RENDERING'] } },
            { status: 'DONE', filePath: { not: null } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      if (same) return this.toDto(same);
    }

    await this.assertLimits(userId);

    const job = await this.prisma.renderJob.create({
      data: {
        userId,
        compositionId: dto.compositionId,
        props: parsed.data,
        format,
        delivery: dto.delivery,
        channel: dto.delivery === 'CHAT' ? (channel ?? 'TELEGRAM') : null,
      },
    });
    this.logger.log(
      `Задача #${job.id}: ${job.compositionId} ${format} ${job.delivery}, userId=${userId}`,
    );
    return this.toDto(job);
  }

  public async findOwn(
    userId: number,
    id: number,
  ): Promise<RenderJobResponseDto> {
    const job = await this.prisma.renderJob.findFirst({
      where: { id, userId },
    });
    if (!job) throw new NotFoundException('Задача не найдена');
    return this.toDto(job);
  }

  private async assertLimits(userId: number): Promise<void> {
    const [active, today] = await Promise.all([
      this.prisma.renderJob.count({
        where: { userId, status: { in: ['QUEUED', 'RENDERING'] } },
      }),
      this.prisma.renderJob.count({
        where: { userId, createdAt: { gte: new Date(Date.now() - DAY_MS) } },
      }),
    ]);
    if (active >= RENDER_LIMITS.activePerUser)
      throw new HttpException(
        'Предыдущий ролик ещё готовится — дождись его',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    if (today >= RENDER_LIMITS.perUserPerDay)
      throw new HttpException(
        'На сегодня роликов хватит — попробуй завтра',
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }

  private toDto(job: RenderJob): RenderJobResponseDto {
    return {
      id: job.id,
      compositionId: job.compositionId,
      format: job.format,
      delivery: job.delivery,
      status: job.status,
      url: this.upload.toPublicUrl(job.filePath),
      fileName: job.filePath ? renderFileName(job) : null,
      error: job.error,
      deliveredAt: job.deliveredAt?.toISOString() ?? null,
    };
  }
}
