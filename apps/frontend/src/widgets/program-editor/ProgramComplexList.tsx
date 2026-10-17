import { PlusIcon } from 'lucide-react'
import { Reorder } from 'motion/react'
import { useNavigate } from 'react-router'

import { useState } from 'react'

import { complexLetter, type ProgramComplex } from '@/entities/program'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { arrangeBy } from './arrange'
import { ProgramComplexRow } from './ProgramComplexRow'

/** Что список умеет делать с комплексами: программы пользователя (frontend-tz, 10.3) и шаблоны админа (14.2) */
export type ComplexListActions = {
  /** Возвращает комплексы после добавления: в новый сразу переходим собирать упражнения */
  addComplex: (name: string) => Promise<{ complexes: { id: number }[] }>
  reorderComplexes: (ids: number[]) => void
}

type ProgramComplexListProps = {
  complexes: ProgramComplex[]
  actions: ComplexListActions
  /** Страница комплекса: название и упражнения */
  complexTo: (complexId: number) => string
  /** Пока сохраняется добавление — кнопка неактивна */
  adding?: boolean
}

// Комплексы программы в порядке очереди: перетаскивание за ручку и добавление.
// Состав комплекса правится на его странице — здесь только очередь, чтобы экран не был перегружен
export const ProgramComplexList = ({ complexes, actions, complexTo, adding }: ProgramComplexListProps) => {
  const navigate = useNavigate()
  // Порядок под пальцем: на сервер уходит один раз, когда строку отпустили
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
        if (created) navigate(complexTo(created.id))
      })
      // Ошибку уже показал общий тост
      .catch(() => undefined)

  return (
    <ScreenSection
      title='Комплексы'
      aside={complexes.length > 1 ? 'порядок — тяни за ручку' : undefined}
    >
      <Text
        size='sm'
        tone='muted'
      >
        Комплекс — это одна тренировка, набор упражнений . Комплексы идут по очереди: A, потом B, потом C — и снова A. Один день-один комплекс
      </Text>
      {shown.length > 0 && (
        <Reorder.Group
          axis='y'
          values={shown.map(c => c.id)}
          onReorder={setDragOrder}
          className='flex flex-col gap-2'
        >
          {shown.map((c, i) => (
            <ProgramComplexRow
              key={c.id}
              complex={c}
              index={i}
              to={complexTo(c.id)}
              onDrop={drop}
            />
          ))}
        </Reorder.Group>
      )}
      <Button
        variant={shown.length ? 'outline' : 'default'}
        className='w-full'
        disabled={adding}
        onClick={() => void addComplex()}
      >
        <PlusIcon strokeWidth={2.5} />
        {shown.length ? 'Добавить комплекс' : 'Добавить первый комплекс'}
      </Button>
    </ScreenSection>
  )
}
