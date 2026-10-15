import type { ProgramTagResponseDto } from '@/shared/api/generated/model'

export type ProgramTag = ProgramTagResponseDto

type Tagged = { tags: ProgramTag[] }

/** Теги, которые есть хотя бы у одного шаблона, по порядку чипов: пустой тег не даст пустой список */
export const templateTags = (templates: Tagged[]): ProgramTag[] => {
  const tags = new Map<number, ProgramTag>()
  for (const t of templates) for (const tag of t.tags) tags.set(tag.id, tag)
  return [...tags.values()].sort((a, b) => a.position - b.position)
}

/** Шаблоны под чипом; code не задан — все */
export const filterByTag = <T extends Tagged>(templates: T[], code: string | null | undefined): T[] =>
  code ? templates.filter(t => t.tags.some(tag => tag.code === code)) : templates

/** Буква комплекса по месту в очереди: A, B, C… */
export const complexLetter = (index: number): string => String.fromCharCode(65 + (index % 26))

/** План подходов: «3 × 8–12» или «3 × 10» */
export const planText = (sets: number, repsMin: number, repsMax: number): string =>
  `${sets} × ${repsMin === repsMax ? repsMin : `${repsMin}–${repsMax}`}`
