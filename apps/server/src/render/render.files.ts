import { RENDER_FORMATS, type RenderFormat } from '@sportbot/render-contract';
import { randomUUID } from 'crypto';
import * as path from 'path';

/** Категория в upload root: раздаётся статикой /api/uploads/renders/ — имена файлов случайные uuid. */
export const RENDERS_CATEGORY = 'renders';

/** Новый файл под задачу: путь относительно upload root, как его хранит RenderJob.filePath. */
export const newRenderFile = (format: RenderFormat) =>
  path.join(RENDERS_CATEGORY, `${randomUUID()}.${RENDER_FORMATS[format].ext}`);

/** Имя файла у получателя: «lower-third-42.webm». */
export const renderFileName = (job: {
  id: number;
  compositionId: string;
  format: string;
}) =>
  `${job.compositionId}-${job.id}.${RENDER_FORMATS[job.format as RenderFormat]?.ext ?? 'bin'}`;
