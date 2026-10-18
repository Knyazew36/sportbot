import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import {
  ensureBrowser,
  renderMedia,
  selectComposition,
} from '@remotion/renderer';
import {
  COMPOSITIONS,
  isCompositionId,
  propsForFormat,
  RENDER_FORMATS,
  type RenderFormat,
} from '@sportbot/render-contract';
import * as os from 'os';
import * as path from 'path';
import { PrismaService } from 'prisma/prisma.service';

import { RenderJob } from '@/generated/prisma/client';
import { newRenderFile, RENDERS_CATEGORY } from '@/render/render.files';
import { UploadService } from '@/upload/upload.service';

/**
 * Рендер задач из очереди (RenderJob) по готовому бандлу Remotion. Отдельный процесс — Chrome и
 * ffmpeg съедают CPU, API от этого тормозить не должен. Ничего не знает о HTTP и доставке:
 * берёт QUEUED, оставляет DONE с файлом или FAILED с текстом ошибки.
 */
@Injectable()
export class RenderWorkerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(`🎞️ ${RenderWorkerService.name}`);
  private readonly serveUrl: string;
  private readonly concurrency: number;
  private ready = false;
  private busy = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
    config: ConfigService,
  ) {
    this.serveUrl = path.resolve(
      config.get<string>('RENDER_BUNDLE_DIR', '../video/build'),
    );
    // Remotion падает, если потоков больше, чем ядер: на маленьком сервере их меньше значения из .env
    this.concurrency = Math.min(
      config.get<number>('RENDER_CONCURRENCY', 2),
      os.cpus().length,
    );
  }

  public async onApplicationBootstrap(): Promise<void> {
    // Воркер один: задача в RENDERING на старте — прерванная падением или рестартом
    const { count } = await this.prisma.renderJob.updateMany({
      where: { status: 'RENDERING' },
      data: {
        status: 'FAILED',
        error: 'Рендер прервался — закажи ролик ещё раз',
        finishedAt: new Date(),
      },
    });
    if (count) this.logger.warn(`Прерванных задач: ${count}`);
    // Chrome Headless Shell скачивается при первом запуске, дальше берётся из кэша
    await ensureBrowser();
    this.ready = true;
    this.logger.log(
      `Готов к рендеру, бандл ${this.serveUrl}, потоков ${this.concurrency}`,
    );
  }

  @Interval(2000)
  public async tick(): Promise<void> {
    if (!this.ready || this.busy) return;
    this.busy = true;
    try {
      let job: RenderJob | null;
      while ((job = await this.claim())) await this.process(job);
    } finally {
      this.busy = false;
    }
  }

  /** Самая старая задача из очереди; захват условным update — не отдаст одну задачу дважды. */
  private async claim(): Promise<RenderJob | null> {
    const next = await this.prisma.renderJob.findFirst({
      where: { status: 'QUEUED' },
      orderBy: { createdAt: 'asc' },
    });
    if (!next) return null;
    const { count } = await this.prisma.renderJob.updateMany({
      where: { id: next.id, status: 'QUEUED' },
      data: { status: 'RENDERING', startedAt: new Date() },
    });
    return count ? { ...next, status: 'RENDERING' } : this.claim();
  }

  private async process(job: RenderJob): Promise<void> {
    const started = Date.now();
    const filePath = newRenderFile(job.format as RenderFormat);
    try {
      const outputLocation = await this.render(job, filePath);
      await this.prisma.renderJob.update({
        where: { id: job.id },
        data: { status: 'DONE', filePath, finishedAt: new Date() },
      });
      this.logger.log(
        `#${job.id} ${job.compositionId} ${job.format} — ${((Date.now() - started) / 1000).toFixed(1)} с, ${outputLocation}`,
      );
    } catch (error) {
      this.upload.deleteByRelativePath(filePath);
      this.logger.error(
        `#${job.id} не отрендерен: ${(error as Error).message}`,
        (error as Error).stack,
      );
      await this.prisma.renderJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: 'Не получилось собрать ролик — попробуй ещё раз',
          finishedAt: new Date(),
        },
      });
    }
  }

  private async render(job: RenderJob, filePath: string): Promise<string> {
    if (!isCompositionId(job.compositionId))
      throw new Error(`Неизвестная композиция ${job.compositionId}`);
    const format = job.format as RenderFormat;
    const spec = RENDER_FORMATS[format];
    if (!spec) throw new Error(`Неизвестный формат ${job.format}`);
    // Props проверены при постановке, но задача могла пролежать в очереди дольше смены схемы
    const props = COMPOSITIONS[job.compositionId].schema.parse(job.props);
    const inputProps = propsForFormat(props, format);

    this.upload.getCategoryDir(RENDERS_CATEGORY);
    const outputLocation = path.join(this.upload.uploadRoot, filePath);
    const composition = await selectComposition({
      serveUrl: this.serveUrl,
      id: job.compositionId,
      inputProps,
    });
    await renderMedia({
      composition,
      serveUrl: this.serveUrl,
      inputProps,
      outputLocation,
      codec: spec.codec,
      pixelFormat: spec.pixelFormat,
      imageFormat: spec.imageFormat,
      proResProfile: spec.proResProfile,
      crf: spec.encoding?.crf,
      x264Preset: spec.encoding?.x264Preset,
      // Флаги кодировщика — перед последним аргументом: им ffmpeg получает путь выходного файла
      ffmpegOverride: ({ args }) => {
        const extra = spec.encoding?.encoderArgs;
        return extra
          ? [...args.slice(0, -1), ...extra, ...args.slice(-1)]
          : args;
      },
      concurrency: this.concurrency,
    });
    return outputLocation;
  }
}
