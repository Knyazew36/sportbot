import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

import { ENTITY_EMOJI } from '@/common/utils';

import { matchesImageSignature } from './upload.utils';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.upload} ${UploadService.name}`,
  );
  /** Категории, раздаваемые статикой по /api/uploads/<категория>/ (см. main.ts). */
  public static readonly PUBLIC_CATEGORIES = ['avatars', 'chat'] as const;

  readonly uploadRoot: string;

  constructor(private readonly config: ConfigService) {
    const uploadDir = this.config.get<string>('UPLOAD_DIR', 'uploads');
    this.uploadRoot = path.isAbsolute(uploadDir)
      ? uploadDir
      : path.resolve(process.cwd(), uploadDir);
  }

  // Создаёт (если нужно) и возвращает абсолютный путь к подпапке категории (avatars, products, ...)
  getCategoryDir(category: string): string {
    const dir = path.join(this.uploadRoot, category);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  // ── Проверка сигнатуры. Если файл не тот, что заявлен ────────────────────────────────────────────────────────────

  public verifyImageSignatureOrThrow(file: Express.Multer.File): void {
    const header = this.readHeader(file.path);
    if (!matchesImageSignature(header, file.mimetype)) {
      this.discardTmpFile(file.path);
      throw new BadRequestException(
        'Содержимое файла не соответствует заявленному типу изображения',
      );
    }
  }

  private readHeader(filePath: string, length = 12): Buffer {
    const fd = fs.openSync(filePath, 'r');
    try {
      const buffer = Buffer.alloc(length);
      fs.readSync(fd, buffer, 0, length, 0);
      return buffer;
    } finally {
      fs.closeSync(fd);
    }
  }

  discardTmpFile(tmpPath: string): void {
    try {
      fs.unlinkSync(tmpPath);
    } catch (error) {
      this.logger.warn(
        `Не удалось удалить временный файл ${tmpPath}: ${error}`,
      );
    }
  }

  // Переносит уже провалидированный файл из стейджинга в публично раздаваемую категорию.
  // Вызывать только после успешной записи ссылки на файл в БД — иначе при падении записи
  // файл остаётся сиротой в стейджинге (не раздаётся публично), а не в раздаваемой директории.
  public commitToCategory(tmpPath: string, category: string): string {
    const filename = path.basename(tmpPath);
    const targetPath = path.join(this.getCategoryDir(category), filename);
    try {
      fs.renameSync(tmpPath, targetPath);
    } catch (error: any) {
      if (error.code === 'EXDEV') {
        fs.copyFileSync(tmpPath, targetPath);
        fs.unlinkSync(tmpPath);
      } else {
        throw error;
      }
    }
    this.logger.log(`Файл сохранён ${category}/${filename}`);
    return `${category}/${filename}`;
  }

  deleteByRelativePath(relativePath: string | null | undefined): void {
    if (!relativePath) return;
    const resolved = this.resolveWithinRoot(relativePath);
    if (!resolved) {
      this.logger.warn(`Отказ удалить файл вне upload root: ${relativePath}`);
      return;
    }
    try {
      fs.unlinkSync(resolved);
      this.logger.log(`Файл удалён ${relativePath}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        this.logger.warn(`Не удалось удалить файл ${relativePath}: ${error}`);
      }
    }
  }

  // Защита от path traversal: resolved-путь обязан остаться внутри upload root
  private resolveWithinRoot(relativePath: string): string | null {
    const resolved = path.resolve(this.uploadRoot, relativePath);
    const rootWithSep = this.uploadRoot.endsWith(path.sep)
      ? this.uploadRoot
      : this.uploadRoot + path.sep;
    return resolved.startsWith(rootWithSep) ? resolved : null;
  }

  toPublicUrl(relativePath: string | null | undefined): string | null {
    return relativePath ? `/uploads/${relativePath}` : null;
  }
}
