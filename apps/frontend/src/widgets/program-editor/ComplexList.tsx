import { PlusIcon } from 'lucide-react'
import { Reorder } from 'motion/react'

import { useState } from 'react'

import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { ComplexCard, LETTERS } from './ComplexCard'
import type { EditorComplex } from './types'

type ComplexListProps = {
  complexes: EditorComplex[]
  onChange: (update: (list: EditorComplex[]) => EditorComplex[]) => void
  /** Следующий по ротации — подсвечен */
  nextId?: number
  /** Какой комплекс раскрыть сразу: например, тот, куда только что добавляли упражнения */
  initialExpandedId?: number | null
  /** Страница подбора упражнений в комплекс */
  addExerciseTo: (complexId: number) => string
}

// Комплексы программы в порядке ротации: перетаскивание за ручку, правка состава, добавление и удаление.
// Общий для программ пользователя (frontend-tz, 10.3) и шаблонов в админке (14.2)
export const ComplexList = ({ complexes, onChange, nextId, initialExpandedId, addExerciseTo }: ComplexListProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(initialExpandedId ?? complexes[0]?.id ?? null)

  const update = (complex: EditorComplex) => onChange(list => list.map(c => (c.id === complex.id ? complex : c)))

  const addComplex = () => {
    const id = Date.now()
    onChange(list => [...list, { id, letter: '', title: `Комплекс ${LETTERS[list.length]}`, exercises: [] }])
    setExpandedId(id)
  }

  return (
    <ScreenSection
      title='Комплексы'
      aside='порядок = очередь, тяни за ручку'
    >
      <Reorder.Group
        axis='y'
        values={complexes}
        onReorder={order => onChange(() => order)}
        className='flex flex-col gap-2'
      >
        {complexes.map((c, i) => (
          <ComplexCard
            key={c.id}
            complex={c}
            index={i}
            isNext={c.id === nextId}
            expanded={expandedId === c.id}
            onToggle={() => setExpandedId(id => (id === c.id ? null : c.id))}
            onChange={update}
            onDelete={() => onChange(list => list.filter(x => x.id !== c.id))}
            addExerciseTo={addExerciseTo(c.id)}
          />
        ))}
      </Reorder.Group>
      <Button
        variant='outline'
        className='w-full'
        onClick={addComplex}
      >
        <PlusIcon strokeWidth={2.5} />
        Добавить комплекс
      </Button>
    </ScreenSection>
  )
}
