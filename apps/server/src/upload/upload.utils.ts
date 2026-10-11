import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as multer from 'multer';
import * as os from 'os';
import * as path from 'path';

const IMAGE_MIME_WHITELIST = ['image/jpeg', 'image/png', 'image/webp'] as const;

type AllowedImageMimeType = (typeof IMAGE_MIME_WHITELIST)[number];

const IMAGE_EXTENSION_BY_MIME: Record<AllowedImageMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Имя файла на диске всегда генерируется сервером (uuid + расширение по проверенному mime) —
// оригинальное имя от клиента никогда не участвует в построении пути (защита от path traversal)
export function generateSafeFilename(mimeType: string): string {
  const extension = IMAGE_EXTENSION_BY_MIME[mimeType as AllowedImageMimeType];
  if (!extension) {
    throw new Error(`Unsupported mime type: ${mimeType}`);
  }
  return `${randomUUID()}.${extension}`;
}

// Client-side Content-Type легко подделать, поэтому дополнительно сверяем magic bytes
export function matchesImageSignature(
  header: Buffer,
  mimeType: string,
): boolean {
  switch (mimeType) {
    case 'image/jpeg':
      return (
        header.length >= 3 &&
        header[0] === 0xff &&
        header[1] === 0xd8 &&
        header[2] === 0xff
      );
    case 'image/png':
      return (
        header.length >= 4 &&
        header[0] === 0x89 &&
        header[1] === 0x50 &&
        header[2] === 0x4e &&
        header[3] === 0x47
      );
    case 'image/webp':
      return (
        header.length >= 12 &&
        header.toString('ascii', 0, 4) === 'RIFF' &&
        header.toString('ascii', 8, 12) === 'WEBP'
      );
    default:
      return false;
  }
}

// Стейджинг вне upload root (и вне globalPrefix статики) — файл никогда не отдаётся публично,
// пока не подтверждён commitToCategory в UploadService после успешной записи в БД
const stagingDir = path.join(os.tmpdir(), 'app-staged-uploads');

export function imageUploadInterceptorOptions(): MulterOptions {
  fs.mkdirSync(stagingDir, { recursive: true });
  const maxFileSize = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;

  return {
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, stagingDir),
      filename: (_req, file, cb) => {
        try {
          cb(null, generateSafeFilename(file.mimetype));
        } catch (error) {
          cb(error as Error, '');
        }
      },
    }),
    limits: { fileSize: maxFileSize },
    fileFilter: (_req, file, cb) => {
      if (
        !IMAGE_MIME_WHITELIST.includes(file.mimetype as AllowedImageMimeType)
      ) {
        cb(
          new BadRequestException(`Недопустимый тип файла: ${file.mimetype}`),
          false,
        );
        return;
      }
      cb(null, true);
    },
  };
}
