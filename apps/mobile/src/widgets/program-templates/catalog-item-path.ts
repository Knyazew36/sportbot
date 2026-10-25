import { type CatalogSource, SOURCE_PARAM } from '@sportbot/api/entities/program';

import { routeHref, ROUTES } from '@/shared/config/routes';

/** Экран программы каталога — порт catalog-item-path.ts: программе пользователя — с табом, иначе её не найти среди шаблонов */
export const catalogItemPath = (id: number, source: CatalogSource) =>
  routeHref(ROUTES.PROGRAM_TEMPLATE, { templateId: id, [SOURCE_PARAM]: source === 'users' ? 'users' : undefined });
