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
  chatStateOf,
  COMPOSITIONS,
  RENDER_FORMATS,
  RENDER_LIMITS,
  type RenderFormat,
} from '@sportbot/render-contract';
import { PrismaService } from 'prisma/prisma.service';

import { BotChannel, Prisma, RenderJob } from '@/generated/prisma/client';
import { UploadService } from '@/upload/upload.service';

import { CreateRenderJobDto } from './dto/create-render-job.dto';
import { RenderJobResponseDto } from './dto/render-job.response.dto';
import { renderFileName } from './render.files';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** 422 в формате ValidationPipe (main.ts): фронт разложит ошибки props под поля формы. */
const fieldError = (fields: Record<string, string[]>) =>
  new UnprocessableEntityException({
    message: Object.values(fields).flat(),
    errors: fields,
  });

/**
 * Очередь рендера: проверяет заказ по контракту композиции, отдаёт уже готовый файл или ставит
 * задачу. Сам не рендерит и не доставляет — это render-worker (отдельный процесс) и render-delivery.
 */
@Injectable()
export class RenderService {
  private readonly logger = new Logger(`🎬 ${RenderService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
  ) {}

  /**
   * Файл ролика: такой же (props и формат) уже готов или в работе — отдаём его, иначе ставим в
   * очередь. toChat — пометка «прислать в чат» на этой же задаче: файл заново не рендерится.
   */
  public async create(
    userId: number,
    channel: BotChannel | null,
    dto: CreateRenderJobDto,
  ): Promise<RenderJobResponseDto> {
    const composition = COMPOSITIONS[dto.compositionId];
    const format: RenderFormat = dto.format ?? composition.formats[0];
    if (!(composition.formats as readonly RenderFormat[]).includes(format))
      throw new BadRequestException('Этот ролик в таком формате не делаем');
    if (dto.toChat && !RENDER_FORMATS[format].chat)
      throw new BadRequestException(
        'Файл слишком тяжёлый для чата — скачай его',
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

    let job =
      (await this.prisma.renderJob.findFirst({
        where: {
          userId,
          compositionId: dto.compositionId,
          format,
          props: { equals: parsed.data },
          OR: [
            { status: { in: ['QUEUED', 'RENDERING'] } },
            { status: 'DONE', filePath: { not: null } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })) ?? (await this.enqueue(userId, dto, format, parsed.data));

    // Повторное «В чат» после отказа бота — пробуем ещё раз; уже отправленный или ждущий — не трогаем
    const chat = chatStateOf(job);
    if (dto.toChat && (chat === 'idle' || chat === 'failed')) {
      job = await this.prisma.renderJob.update({
        where: { id: job.id },
        data: {
          chatRequestedAt: new Date(),
          channel: channel ?? 'TELEGRAM',
          deliveredAt: null,
          chatError: null,
        },
      });
      this.logger.log(`Задача #${job.id}: прислать в ${job.channel}`);
    }
    return this.toDto(job);
  }

  /**
   * Свои файлы за срок хранения: по ним фронт показывает, что готово и что в работе.
   * Без compositionId — файлы всех роликов, для списка «Мои файлы».
   */
  public async list(
    userId: number,
    compositionId?: string,
  ): Promise<RenderJobResponseDto[]> {
    const jobs = await this.prisma.renderJob.findMany({
      where: {
        userId,
        ...(compositionId && { compositionId }),
        createdAt: {
          gte: new Date(Date.now() - RENDER_LIMITS.fileTtlHours * HOUR_MS),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return jobs.map((job) => this.toDto(job));
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

  private async enqueue(
    userId: number,
    dto: CreateRenderJobDto,
    format: RenderFormat,
    props: Record<string, unknown>,
  ): Promise<RenderJob> {
    await this.assertLimits(userId);
    const job = await this.prisma.renderJob.create({
      data: {
        userId,
        compositionId: dto.compositionId,
        props: props as Prisma.InputJsonObject,
        format,
      },
    });
    this.logger.log(
      `Задача #${job.id}: ${job.compositionId} ${format}, userId=${userId}`,
    );
    return job;
  }

  private async assertLimits(userId: number): Promise<void> {
    const [queued, active, today] = await Promise.all([
      this.prisma.renderJob.count({
        where: { status: { in: ['QUEUED', 'RENDERING'] } },
      }),
      this.prisma.renderJob.count({
        where: { userId, status: { in: ['QUEUED', 'RENDERING'] } },
      }),
      this.prisma.renderJob.count({
        where: { userId, createdAt: { gte: new Date(Date.now() - DAY_MS) } },
      }),
    ]);
    if (queued >= RENDER_LIMITS.queueMax)
      throw new HttpException(
        'Сейчас много роликов в работе — попробуй через пару минут',
        HttpStatus.TOO_MANY_REQUESTS,
      );
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
      props: job.props as Record<string, unknown>,
      status: job.status,
      // Как в RenderCleanupService: срок хранения считается от готовности файла
      expiresAt:
        job.filePath && job.finishedAt
          ? new Date(
              job.finishedAt.getTime() + RENDER_LIMITS.fileTtlHours * HOUR_MS,
            ).toISOString()
          : null,
      url: this.upload.toPublicUrl(job.filePath),
      fileName: job.filePath ? renderFileName(job) : null,
      error: job.error,
      chatRequestedAt: job.chatRequestedAt?.toISOString() ?? null,
      deliveredAt: job.deliveredAt?.toISOString() ?? null,
      chatError: job.chatError,
    };
  }
}
