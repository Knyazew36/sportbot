import { type CatalogSource, SOURCE_PARAM } from '@sportbot/api/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'

/** Страница программы каталога: программе пользователя — с табом, иначе её не найти среди шаблонов */
export const catalogItemPath = (id: number, source: CatalogSource): string => {
  const path = buildPath(ROUTES.PROGRAM_TEMPLATE, { templateId: id })
  return source === 'users' ? `${path}?${SOURCE_PARAM}=users` : path
}
