import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import {
  ensureBrowser,
  makeCancelSignal,
  renderMedia,
  selectComposition,
} from '@remotion/renderer';
import {
  COMPOSITIONS,
  isCompositionId,
  propsForFormat,
  RENDER_FORMATS,
  RENDER_LIMITS,
  type RenderFormat,
} from '@sportbot/render-contract';
import { execFile } from 'child_process';
import { rm } from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { PrismaService } from 'prisma/prisma.service';

import { RenderJob } from '@/generated/prisma/client';
import { newRenderFile, RENDERS_CATEGORY } from '@/render/render.files';
import { UploadService } from '@/upload/upload.service';

/** Аргументы ffmpeg с настройками формата, которых нет среди опций renderMedia. */
const withEncoding = (
  args: string[],
  encoding: (typeof RENDER_FORMATS)[RenderFormat]['encoding'],
): string[] => {
  const out = [...args];
  const swap = encoding?.encoder;
  if (swap) {
    const codec = out.indexOf('-c:v');
    if (codec >= 0) out[codec + 1] = swap.name;
    const profile = out.indexOf('-profile:v');
    if (profile >= 0) out.splice(profile, 2);
    const pixels = out.indexOf('-pix_fmt');
    if (pixels >= 0) out[pixels + 1] = swap.pixelFormat;
  }
  // Флаги кодировщика — перед последним аргументом: им ffmpeg получает путь выходного файла
  const extra = encoding?.encoderArgs;
  return extra ? [...out.slice(0, -1), ...extra, ...out.slice(-1)] : out;
};

const execFileAsync = promisify(execFile);

/**
 * HEVC с альфой из PNG-в-MOV: libx265 сам включает слой альфы на yuva420p, hvc1 — метка, которую
 * ждут плееры Apple (с hev1 iPhone файл не откроет)
 */
const HEVC_ALPHA_ARGS = (src: string, out: string): string[] => [
  '-y',
  '-i',
  src,
  '-an',
  '-c:v',
  'libx265',
  '-pix_fmt',
  'yuva420p',
  '-crf',
  '20',
  '-preset',
  'medium',
  '-tag:v',
  'hvc1',
  '-movflags',
  '+faststart',
  out,
];

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
  /** ffmpeg 8 с x265, собранным с альфой (собирает deploy.sh через scripts/build-ffmpeg-alpha.sh) — для transcode: 'hevc-alpha' */
  private readonly ffmpegAlpha: string;
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
    this.ffmpegAlpha = path.resolve(config.get<string>('FFMPEG_ALPHA_PATH')!);
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
    // Рендер уступает процессор API на той же машине: Chrome и ffmpeg наследуют приоритет процесса
    try {
      os.setPriority(10);
    } catch (error) {
      this.logger.warn(
        `Не удалось понизить приоритет: ${(error as Error).message}`,
      );
    }
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
    const { cancelSignal, cancel } = makeCancelSignal();
    const timeout = setTimeout(cancel, RENDER_LIMITS.renderTimeoutSec * 1000);
    // С перекодированием Remotion пишет промежуточный файл, итоговый собирает ffmpeg с альфой
    const renderLocation = spec.transcode
      ? `${outputLocation}.src.mov`
      : outputLocation;
    try {
      await this.renderTo(
        renderLocation,
        job.compositionId,
        inputProps,
        spec,
        cancelSignal,
      );
      if (spec.transcode) await this.transcode(job.id, renderLocation, outputLocation);
    } finally {
      clearTimeout(timeout);
      if (spec.transcode) await rm(renderLocation, { force: true });
    }
    return outputLocation;
  }

  private async transcode(
    jobId: number,
    src: string,
    out: string,
  ): Promise<void> {
    const started = Date.now();
    this.logger.debug(`#${jobId} перекодируем в HEVC с альфой: ${this.ffmpegAlpha}`);
    try {
      await execFileAsync(this.ffmpegAlpha, HEVC_ALPHA_ARGS(src, out), {
        timeout: RENDER_LIMITS.renderTimeoutSec * 1000,
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (error) {
      // Нет бинарника или x265 без альфы («does not support alpha layer») — смотреть stderr
      const stderr = (error as { stderr?: string }).stderr?.slice(-2000);
      throw new Error(
        `ffmpeg с альфой не перекодировал: ${(error as Error).message}${stderr ? `
${stderr}` : ''}`,
      );
    }
    this.logger.log(
      `#${jobId} HEVC с альфой — ${((Date.now() - started) / 1000).toFixed(1)} с`,
    );
  }

  private async renderTo(
    outputLocation: string,
    id: string,
    inputProps: Record<string, unknown>,
    spec: (typeof RENDER_FORMATS)[RenderFormat],
    cancelSignal: ReturnType<typeof makeCancelSignal>['cancelSignal'],
  ): Promise<void> {
    const composition = await selectComposition({
      serveUrl: this.serveUrl,
      id,
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
      ffmpegOverride: ({ args }) => withEncoding(args, spec.encoding),
      concurrency: this.concurrency,
      cancelSignal,
    });
  }
}
