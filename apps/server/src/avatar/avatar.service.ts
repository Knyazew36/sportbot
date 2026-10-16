import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { BotChannel, Prisma, User } from '@/generated/prisma/client';
import { TelegramBotService } from '@/messengers/telegram';
import { UploadService } from '@/upload/upload.service';

const CATEGORY = 'avatars';
const DOWNLOAD_TIMEOUT_MS = 10_000;
const MAX_DOWNLOAD_BYTES = 5 * 1024 * 1024;

/** Маркер в User.data: пользователь сам убрал фото — из мессенджера больше не подставляем. */
const REMOVED_FLAG = 'avatarRemoved';

type UserData = Record<string, unknown>;

const asRecord = (data: unknown): UserData =>
  data && typeof data === 'object' && !Array.isArray(data)
    ? { ...(data as UserData) }
    : {};

/**
 * Аватар в Mini App. Пока своего фото нет, при входе берём фото из мессенджера, через который
 * открыли приложение, — один раз: дальше аватар наш и мессенджер его не трогает.
 * Своё фото заменяет любое; удалённое фото оставляет инициалы навсегда, пока не загрузят новое.
 */
@Injectable()
export class AvatarService {
  private readonly logger = new Logger(`🖼️ ${AvatarService.name}`);
  /** Кому фото уже качается: initData приходит с каждым запросом, второй загрузки не нужно. */
  private readonly inFlight = new Set<number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadService,
    // Мессенджер без env не подключается — тогда и его сервиса нет
    @Optional() private readonly telegramBot?: TelegramBotService,
  ) {}

  // ── Ссылка ──────────────────────────────────────────────────────────────

  public url(avatarPath: string | null): string | null {
    return this.uploads.toPublicUrl(avatarPath);
  }

  // ── Фото из мессенджера ─────────────────────────────────────────────────

  /** Не ждёт загрузки: вход в приложение не должен тормозить из-за CDN мессенджера. */
  public fillFromMessenger(user: User, channel: BotChannel | null): void {
    if (!channel || user.avatarPath || this.inFlight.has(user.id)) return;
    if (asRecord(user.data)[REMOVED_FLAG]) return;

    this.inFlight.add(user.id);
    void this.fill(user, channel)
      .catch((error: Error) =>
        this.logger.error(
          `Фото из ${channel} не загружено: userId=${user.id}: ${error.message}`,
          error.stack,
        ),
      )
      .finally(() => this.inFlight.delete(user.id));
  }

  // ── Своё фото ───────────────────────────────────────────────────────────

  /**
   * Файл уже проверен по сигнатуре и лежит в стейджинге. Старый файл удаляем только после
   * записи нового пути: если update упадёт, сиротой останется новый файл, а не потеряется старый.
   */
  public async upload(
    userId: number,
    file: Express.Multer.File,
  ): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { avatarPath: true, data: true },
    });
    const avatarPath = this.uploads.commitToCategory(file.path, CATEGORY);
    const data = asRecord(user.data);
    delete data[REMOVED_FLAG];
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarPath, data: data as Prisma.InputJsonValue },
    });
    this.uploads.deleteByRelativePath(user.avatarPath);
    this.logger.log(`Своё фото загружено: userId=${userId}, ${avatarPath}`);
  }

  public async remove(userId: number): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { avatarPath: true, data: true },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarPath: null,
        data: {
          ...asRecord(user.data),
          [REMOVED_FLAG]: true,
        },
      },
    });
    this.uploads.deleteByRelativePath(user.avatarPath);
    this.logger.log(`Фото удалено, дальше инициалы: userId=${userId}`);
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private async fill(user: User, channel: BotChannel): Promise<void> {
    const sourceUrl = await this.sourceUrl(user, channel);
    if (!sourceUrl) {
      this.logger.debug(`В ${channel} фото нет: userId=${user.id}`);
      return;
    }

    const buffer = await this.download(sourceUrl);
    const avatarPath = this.uploads.saveImageBuffer(buffer, CATEGORY);
    if (!avatarPath) {
      this.logger.warn(
        `Фото из ${channel} не jpeg/png/webp: userId=${user.id}`,
      );
      return;
    }

    // Пока качали, могли загрузить своё фото — тогда наше не нужно
    const { count } = await this.prisma.user.updateMany({
      where: { id: user.id, avatarPath: null },
      data: { avatarPath },
    });
    if (!count) {
      this.uploads.deleteByRelativePath(avatarPath);
      this.logger.debug(
        `Аватар уже задан, фото из ${channel} не нужно: userId=${user.id}`,
      );
      return;
    }
    this.logger.log(
      `Фото взято из ${channel}: userId=${user.id}, ${avatarPath}`,
    );
  }

  private async sourceUrl(
    user: User,
    channel: BotChannel,
  ): Promise<string | null> {
    if (channel === 'TELEGRAM') {
      if (!user.telegramId || !this.telegramBot) return null;
      return this.telegramBot.getProfilePhotoUrl(user.telegramId);
    }
    const photoUrl = asRecord(user.maxData).photo_url;
    return typeof photoUrl === 'string' && photoUrl.startsWith('https://')
      ? photoUrl
      : null;
  }

  private async download(url: string): Promise<Buffer> {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const length = Number(response.headers.get('content-length'));
    if (length > MAX_DOWNLOAD_BYTES)
      throw new Error(`слишком большой файл: ${length} байт`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_DOWNLOAD_BYTES)
      throw new Error(`слишком большой файл: ${buffer.length} байт`);
    return buffer;
  }
}
