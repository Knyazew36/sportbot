import { RENDER_FORMATS, type RenderFormat } from '@sportbot/render-contract';
import { randomUUID } from 'crypto';
import * as path from 'path';

import { slugify } from '@/common/utils';

/** Категория в upload root: раздаётся статикой /api/uploads/renders/ — имена файлов случайные uuid. */
export const RENDERS_CATEGORY = 'renders';

/** Новый файл под задачу: путь относительно upload root, как его хранит RenderJob.filePath. */
export const newRenderFile = (format: RenderFormat) =>
  path.join(RENDERS_CATEGORY, `${randomUUID()}.${RENDER_FORMATS[format].ext}`);

/** Название ролика из props: есть у композиций с полем title (плашка — название упражнения). */
export const renderTitle = (job: { props: unknown }): string | null => {
  const title = (job.props as Record<string, unknown> | null)?.title;
  return typeof title === 'string' && title.trim() ? title.trim() : null;
};

/** Сколько символов title берём в имя файла: длинное имя режут мессенджеры и проводник. */
const TITLE_SLUG_MAX = 40;

/**
 * Имя файла у получателя: «zhim-gantelej-lezha-lower-third.mov» — по нему в загрузках видно,
 * что внутри. Без title — «lower-third-42.mov».
 */
export const renderFileName = (job: {
  id: number;
  compositionId: string;
  format: string;
  props: unknown;
}) => {
  const ext = RENDER_FORMATS[job.format as RenderFormat]?.ext ?? 'bin';
  const title = renderTitle(job);
  const slug = title
    ? slugify(title, '').slice(0, TITLE_SLUG_MAX).replace(/-$/, '')
    : '';
  return slug
    ? `${slug}-${job.compositionId}.${ext}`
    : `${job.compositionId}-${job.id}.${ext}`;
};
