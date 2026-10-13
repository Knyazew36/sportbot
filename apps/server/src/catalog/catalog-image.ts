import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { uploadRoot } from './catalog.service';

const CATEGORY = 'catalog';

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const maxFileSize = (): number =>
  Number(process.env.MAX_FILE_SIZE) || 5_242_880;

/**
 * Картинка записи справочника: URL скачивается в uploads/catalog/, имя файла — уже лежащий там файл.
 * @returns путь относительно upload root.
 */
export async function resolveCatalogImage(source: string): Promise<string> {
  const dir = path.join(uploadRoot(), CATEGORY);
  fs.mkdirSync(dir, { recursive: true });

  if (!/^https?:\/\//i.test(source)) {
    // Имя файла без каталогов: защита от выхода за пределы uploads/catalog
    const name = path.basename(source);
    if (!fs.existsSync(path.join(dir, name)))
      throw new BadRequestException(
        `Файл ${name} не найден в uploads/${CATEGORY}.`,
      );
    return `${CATEGORY}/${name}`;
  }

  const response = await fetch(source, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok)
    throw new BadRequestException(
      `Картинка не скачалась (${response.status}): ${source}`,
    );
  const type = (response.headers.get('content-type') ?? '')
    .split(';')[0]
    .trim();
  const extension = EXTENSION_BY_TYPE[type];
  if (!extension)
    throw new BadRequestException(
      `Картинка должна быть JPEG, PNG или WebP, а пришло «${type || 'неизвестно'}»: ${source}`,
    );
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxFileSize())
    throw new BadRequestException(
      `Картинка больше ${maxFileSize()} байт: ${source}`,
    );
  const name = `${randomUUID()}.${extension}`;
  fs.writeFileSync(path.join(dir, name), buffer);
  return `${CATEGORY}/${name}`;
}
