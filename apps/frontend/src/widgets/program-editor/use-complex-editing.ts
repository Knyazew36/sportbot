import type { ComplexExerciseValues, ProgramComplex } from '@/entities/program'
import { useUndoableQueue } from '@/shared/lib/hooks/use-undoable-queue'
import { normalizeSupersets } from '@/shared/lib/superset'

import { arrangeBy } from './arrange'
import type { ComplexActions } from './ComplexEditor'

/**
 * Правка комплекса, которой ещё нет в ответе сервера. Суперсет — по id участников, а не по номеру:
 * пока правка ждёт, сервер может перенумеровать суперсеты, и номер указал бы на чужой
 */
type ComplexEdit =
  | { type: 'delete'; id: number }
  | { type: 'ungroup-item'; id: number }
  | { type: 'ungroup-superset'; ids: number[] }
  | { type: 'reorder'; ids: number[] }

type Exercise = ProgramComplex['exercises'][number]

// Каждая правка повторяет то, что сделает сервер; повтор поверх уже применённой ничего не меняет
const applyEdit = (items: Exercise[], edit: ComplexEdit): Exercise[] => {
  switch (edit.type) {
    case 'delete':
      return items.filter(e => e.id !== edit.id)
    case 'ungroup-superset':
      return items.map(e => (edit.ids.includes(e.id) ? { ...e, superset: null } : e))
    case 'reorder':
      return arrangeBy(items, edit.ids)
    case 'ungroup-item': {
      // Как на сервере: упражнение встаёт сразу за своим бывшим блоком
      const item = items.find(e => e.id === edit.id)
      if (!item || item.superset === null) return items
      const rest = items.filter(e => e.id !== edit.id)
      const lastMember = rest.findLastIndex(e => e.superset === item.superset)
      return rest.toSpliced(lastMember + 1, 0, { ...item, superset: null })
    }
  }
}

/** Что редактор комплекса умеет отправить на сервер: программы пользователя и шаблоны админа */
export type ComplexMutations = {
  renameComplex: (id: number, name: string) => Promise<unknown>
  deleteComplex: (id: number) => Promise<unknown>
  updateExercise: (id: number, plan: ComplexExerciseValues) => Promise<unknown>
  deleteExercise: (id: number) => Promise<unknown>
  reorderExercises: (complexId: number, ids: number[]) => Promise<unknown>
  ungroupExercise: (id: number) => Promise<unknown>
  ungroupSuperset: (complexId: number, superset: number) => Promise<unknown>
}

type Options = {
  mutations: ComplexMutations
  /** Комплекс из кэша на момент отправки — уже с ответами прошлых правок */
  readComplex: () => ProgramComplex | undefined
  onDeleted: () => void
}

/**
 * Правки комплекса по очереди; удаление упражнения и разборка суперсета — с «Отменить» на 3 секунды.
 * view накладывает на комплекс правки, которые ждут или ещё в пути
 */
export const useComplexEditing = ({ mutations: m, readComplex, onDeleted }: Options) => {
  const queue = useUndoableQueue<ComplexEdit>(async edit => {
    const complex = readComplex()
    switch (edit.type) {
      case 'delete':
        return m.deleteExercise(edit.id)
      case 'ungroup-item':
        // Уже не в суперсете: его успела разобрать прошлая правка
        if (complex?.exercises.find(e => e.id === edit.id)?.superset === null) return
        return m.ungroupExercise(edit.id)
      case 'ungroup-superset': {
        // Номер берём из свежих данных: прошлые правки могли перенумеровать суперсеты
        const superset = complex?.exercises.find(e => edit.ids.includes(e.id) && e.superset !== null)?.superset
        if (!complex || superset == null) return
        return m.ungroupSuperset(complex.id, superset)
      }
      case 'reorder':
        return complex && m.reorderExercises(complex.id, edit.ids)
    }
  })

  const view = (complex: ProgramComplex): ProgramComplex =>
    queue.shown.length
      ? { ...complex, exercises: normalizeSupersets(queue.shown.reduce(applyEdit, complex.exercises)) }
      : complex

  const actions = (complex: ProgramComplex): ComplexActions => ({
    renameComplex: (id, name) => queue.run(() => m.renameComplex(id, name)),
    deleteComplex: id => queue.run(() => m.deleteComplex(id)).then(onDeleted),
    updateExercise: (id, plan) => queue.run(() => m.updateExercise(id, plan)),
    reorderExercises: (_, ids) => queue.send({ type: 'reorder', ids }),
    deleteExercise: id => queue.defer({ type: 'delete', id }, 'Упражнение убрано'),
    ungroupExercise: id => queue.defer({ type: 'ungroup-item', id }, 'Упражнение вынесено из суперсета'),
    ungroupSuperset: (_, superset) =>
      queue.defer(
        { type: 'ungroup-superset', ids: complex.exercises.filter(e => e.superset === superset).map(e => e.id) },
        'Суперсет разгруппирован',
      ),
  })

  return { view, actions }
}
