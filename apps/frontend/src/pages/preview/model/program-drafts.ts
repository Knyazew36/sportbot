import { useSyncExternalStore } from 'react'

import { buildPath, ROUTES } from '@/shared/config/paths'

import { type Complex, programs, templates } from './mock'

// Черновики редактируемых программ в памяти превью: редактор и страница подбора упражнений
// работают с одними данными, пока нет API. Ключ — programId из адреса: число — программа пользователя,
// «new» — программа с нуля, «tpl-N» — шаблон в админке (у него тот же редактор, frontend-tz, 14.2)
type Drafts = Record<string, Complex[]>

const TEMPLATE_PREFIX = 'tpl-'
const LETTERS = 'ABCDEFGHIJ'

let drafts: Drafts = {}
const listeners = new Set<() => void>()

export const templateDraftId = (templateId: number | string) => `${TEMPLATE_PREFIX}${templateId}`

/** Куда вернуться из подбора упражнений: в редактор программы или шаблона */
export const editorPathOf = (programId: string) =>
  programId.startsWith(TEMPLATE_PREFIX)
    ? buildPath(ROUTES.PREVIEW_ADMIN_TEMPLATE, { templateId: programId.slice(TEMPLATE_PREFIX.length) })
    : buildPath(ROUTES.PREVIEW_PROGRAM, { programId })

const blank = (): Complex[] => [{ id: 1, letter: 'A', title: 'Комплекс A', exercises: [] }]

const initial = (programId: string): Complex[] => {
  if (programId.startsWith(TEMPLATE_PREFIX)) {
    const template = templates.find(t => String(t.id) === programId.slice(TEMPLATE_PREFIX.length))
    if (!template) return blank()
    return template.complexes.map((c, i) => ({
      id: i + 1,
      letter: LETTERS[i] ?? '',
      title: c.title,
      exercises: c.exercises.map((e, j) => ({ id: (i + 1) * 100 + j, ...e })),
    }))
  }
  return structuredClone(programs.find(p => String(p.id) === programId)?.complexes) ?? blank()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Ленивое заведение черновика без оповещения: значение то же самое при любом числе вызовов,
// а ссылка стабильна — иначе Reorder пересоздавал бы карточки на каждый рендер
const read = (programId: string) => {
  if (!drafts[programId]) drafts = { ...drafts, [programId]: initial(programId) }
  return drafts[programId]!
}

export const setDraft = (programId: string, update: (complexes: Complex[]) => Complex[]) => {
  drafts = { ...drafts, [programId]: update(read(programId)) }
  listeners.forEach(l => l())
}

export const useProgramDraft = (programId: string) => useSyncExternalStore(subscribe, () => read(programId))
