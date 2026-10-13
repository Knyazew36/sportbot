import { type Equipment, MUSCLE_GROUPS, type MuscleDto } from './types'

/** Как nameNormalized на бэке: нижний регистр, ё→е, без знаков — чтобы «приседания» нашли «Приседания» */
export const normalizeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()

export type CatalogFilter = {
  query: string
  /** Подпись группы из MUSCLE_GROUPS или «Все» */
  group: string
  equipment?: Equipment | 'ALL'
}

// Тот же отбор, что сделает API по query / filter_muscle / filter_equipment — в превью считаем на клиенте
export const matchesCatalog = (
  item: { name: string; muscles: MuscleDto[]; equipment?: Equipment | null },
  { query, group, equipment = 'ALL' }: CatalogFilter,
) => {
  const codes = MUSCLE_GROUPS.find(g => g.label === group)?.codes
  return (
    normalizeName(item.name).includes(normalizeName(query)) &&
    (!codes || item.muscles.some(m => codes.includes(m.code))) &&
    (equipment === 'ALL' || item.equipment === equipment)
  )
}

export const muscleNames = (muscles: MuscleDto[]) => muscles.map(m => m.name).join(' · ')

/**
 * Техника в справочнике — абзац ключевых пунктов и строка «Ошибки: а, б, в» (формат импорта catalog.json).
 * Для карточки режем на пункты: предложения абзаца и ошибки по запятым
 */
export const splitTechnique = (technique: string | null) => {
  if (!technique) return { points: [], mistakes: [] }
  const lines = technique
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
  const mistakesLine = lines.find(l => /^ошибки:/i.test(l))
  const points = lines
    .filter(l => l !== mistakesLine)
    .flatMap(l => l.split(/(?<=\.)\s+(?=[А-ЯЁA-Z])/))
    .map(p => p.replace(/\.$/, ''))
  const mistakes = mistakesLine
    ? mistakesLine
        .replace(/^ошибки:\s*/i, '')
        .split(/,\s+/)
        .map(m => m.replace(/\.$/, ''))
    : []
  return { points, mistakes }
}

/** «Как делать» у растяжки — один абзац: для пошагового показа режем на предложения */
export const splitSteps = (text: string | null) =>
  (text ?? '')
    .split(/(?<=[.!?])\s+(?=[А-ЯЁA-Z])/)
    .map(step => step.trim().replace(/\.$/, ''))
    .filter(Boolean)
