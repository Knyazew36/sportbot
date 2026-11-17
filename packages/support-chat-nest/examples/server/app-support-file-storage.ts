import { SUPPORT_LIMITS } from '@app/support-chat-core';
import { SupportFileStorage } from '@app/support-chat-nest';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import * as path from 'path';

/** Корень загрузок на диске. Сервер раздаёт его статикой — см. main.ts в INSTALL.md. */
export const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR ?? 'uploads');
/** Папка вложений чата внутри UPLOAD_ROOT — она же часть пути в БД и публичной ссылке. */
export const SUPPORT_UPLOAD_CATEGORY = 'support';

const STAGING_DIR = path.join(UPLOAD_ROOT, 'tmp');
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * Вложения чата на локальном диске: только картинки (jpeg/png/webp) с проверкой сигнатуры —
 * заявленному mimetype не верим. Порядок вызовов задаёт модуль: multer пишет во временную папку →
 * prepare → запись в БД → commit (перенос на место); ошибка до commit → discard.
 *
 * Если в проекте свой файловый сервис (S3, общий UploadService) — реализовать те же шесть методов поверх него.
 */
@Injectable()
export class AppSupportFileStorage extends SupportFileStorage {
  private readonly logger = new Logger(`🎧 ${AppSupportFileStorage.name}`);

  // ── Файлы ──────────────────────────────────────────────────────────────────

  public multerOptions(): MulterOptions {
    fs.mkdirSync(STAGING_DIR, { recursive: true });
    return {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, STAGING_DIR),
        // Имя — случайное: исходное имя файла хранится в БД отдельно, на диск не попадает
        filename: (_req, file, cb) =>
          cb(null, `${randomUUID()}${EXTENSIONS[file.mimetype] ?? ''}`),
      }),
      limits: { fileSize: MAX_FILE_SIZE, files: SUPPORT_LIMITS.attachmentsMax },
      fileFilter: (_req, file, cb) =>
        EXTENSIONS[file.mimetype]
          ? cb(null, true)
          : cb(
              new BadRequestException(
                `Недопустимый тип файла: ${file.mimetype}`,
              ),
              false,
            ),
    };
  }

  public prepare(file: Express.Multer.File): string {
    if (!this.matchesSignature(file)) {
      fs.rmSync(file.path, { force: true });
      throw new BadRequestException(
        'Содержимое файла не соответствует заявленному типу изображения',
      );
    }
    return `${SUPPORT_UPLOAD_CATEGORY}/${path.basename(file.path)}`;
  }

  public commit(file: Express.Multer.File): void {
    const dir = path.join(UPLOAD_ROOT, SUPPORT_UPLOAD_CATEGORY);
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, path.basename(file.path));
    try {
      fs.renameSync(file.path, target);
    } catch (error) {
      // Временная папка на другом диске — rename не работает, копируем
      if ((error as NodeJS.ErrnoException).code !== 'EXDEV') throw error;
      fs.copyFileSync(file.path, target);
      fs.rmSync(file.path, { force: true });
    }
    this.logger.log(`Вложение сохранено ${SUPPORT_UPLOAD_CATEGORY}/${path.basename(target)}`);
  }

  // Файл мог уже удалить prepare — отсутствие файла не ошибка
  public discard(file: Express.Multer.File): void {
    fs.rmSync(file.path, { force: true });
  }

  /** Путь от адреса API: клиент склеит его с assetBaseUrl (адрес API с глобальным префиксом). */
  public toPublicUrl(relativePath: string): string | null {
    return relativePath ? `/uploads/${relativePath}` : null;
  }

  public remove(relativePath: string): void {
    // Путь из БД, но всё равно не даём выйти за корень загрузок
    const target = path.resolve(UPLOAD_ROOT, relativePath);
    if (!target.startsWith(UPLOAD_ROOT + path.sep)) {
      this.logger.warn(`Путь вне корня загрузок, не удаляем: ${relativePath}`);
      return;
    }
    fs.rmSync(target, { force: true });
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  private matchesSignature(file: Express.Multer.File): boolean {
    const header = Buffer.alloc(12);
    const fd = fs.openSync(file.path, 'r');
    try {
      fs.readSync(fd, header, 0, header.length, 0);
    } finally {
      fs.closeSync(fd);
    }
    switch (file.mimetype) {
      case 'image/jpeg':
        return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
      case 'image/png':
        return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      case 'image/webp':
        return header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
      default:
        return false;
    }
  }
}
