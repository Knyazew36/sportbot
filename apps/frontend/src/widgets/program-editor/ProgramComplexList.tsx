import { PlusIcon } from 'lucide-react'
import { Reorder } from 'motion/react'

import { useState } from 'react'

import { complexLetter, type ComplexExerciseValues, type ProgramComplex } from '@/entities/program'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { arrangeBy } from './arrange'
import { ProgramComplexCard } from './ProgramComplexCard'

/** Что редактор умеет делать с программой: программы пользователя (frontend-tz, 10.3) и шаблоны админа (14.2) */
export type ComplexEditorActions = {
  /** Возвращает комплексы после добавления: новый сразу раскрывается */
  addComplex: (name: string) => Promise<{ complexes: { id: number }[] }>
  reorderComplexes: (ids: number[]) => void
  renameComplex: (id: number, name: string) => Promise<unknown>
  deleteComplex: (id: number) => Promise<unknown>
  updateExercise: (id: number, plan: ComplexExerciseValues) => Promise<unknown>
  deleteExercise: (id: number) => void
  reorderExercises: (complexId: number, ids: number[]) => void
}

type ProgramComplexListProps = {
  complexes: ProgramComplex[]
  actions: ComplexEditorActions
  /** Какой комплекс раскрыть сразу: например, тот, куда только что добавляли упражнения */
  initialExpandedId?: number | null
  /** Страница подбора упражнений в комплекс */
  addExerciseTo: (complexId: number) => string
  /** Пока сохраняется добавление — кнопка неактивна */
  adding?: boolean
}

// Комплексы программы в порядке очереди: перетаскивание за ручку, правка состава, добавление и удаление.
// Каждое действие сразу уходит на сервер — черновика на клиенте нет
export const ProgramComplexList = ({
  complexes,
  actions,
  initialExpandedId,
  addExerciseTo,
  adding,
}: ProgramComplexListProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(initialExpandedId ?? complexes[0]?.id ?? null)
  // Порядок под пальцем: на сервер уходит один раз, когда карточку отпустили
  const [dragOrder, setDragOrder] = useState<number[] | null>(null)
  const shown = arrangeBy(complexes, dragOrder ?? undefined)

  const drop = () => {
    if (!dragOrder) return
    const changed = dragOrder.some((id, i) => id !== complexes[i]?.id)
    if (changed) actions.reorderComplexes(dragOrder)
    setDragOrder(null)
  }

  const addComplex = () =>
    actions
      .addComplex(`Комплекс ${complexLetter(complexes.length)}`)
      .then(program => {
        const created = program.complexes.at(-1)
        if (created) setExpandedId(created.id)
      })
      // Ошибку уже показал общий тост
      .catch(() => undefined)

  return (
    <ScreenSection
      title='Комплексы'
      aside='порядок = очередь, тяни за ручку'
    >
      <Reorder.Group
        axis='y'
        values={shown.map(c => c.id)}
        onReorder={setDragOrder}
        className='flex flex-col gap-2'
      >
        {shown.map((c, i) => (
          <ProgramComplexCard
            key={c.id}
            complex={c}
            index={i}
            expanded={expandedId === c.id}
            onToggle={() => setExpandedId(id => (id === c.id ? null : c.id))}
            onDrop={drop}
            actions={actions}
            addExerciseTo={addExerciseTo(c.id)}
          />
        ))}
      </Reorder.Group>
      <Button
        variant='outline'
        className='w-full'
        disabled={adding}
        onClick={() => void addComplex()}
      >
        <PlusIcon strokeWidth={2.5} />
        Добавить комплекс
      </Button>
    </ScreenSection>
  )
}
