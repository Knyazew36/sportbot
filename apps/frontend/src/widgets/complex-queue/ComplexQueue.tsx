import { useState } from 'react'

import { EXERCISE_FORMS } from '@/shared/lib/plural-forms'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { complexLetter, type ProgramComplex } from '@/entities/program'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Ticket } from '@/shared/ui/kit/Ticket'
import { Eyebrow } from '@/shared/ui/kit/Typography'

import { ComplexSheet } from './ComplexSheet'

type ComplexQueueProps = {
  complexes: ProgramComplex[]
  /** Какой билет подсвечен: следующий по очереди или выбранный на сегодня */
  activeId: number | undefined
  aside?: string
  /** Выбор комплекса из шторки; без него шторка только показывает состав */
  onPick?: (id: number) => void
  pickLabel?: string
}

// Очередь комплексов программы билетами. Билет открывает состав комплекса в шторке
export const ComplexQueue = ({ complexes, activeId, aside, onPick, pickLabel }: ComplexQueueProps) => {
  const [opened, setOpened] = useState<{ complex: ProgramComplex; index: number } | null>(null)

  return (
    <ScreenSection
      title='Очередь тренировок'
      aside={aside}
      bleed
    >
      <ol className='no-scrollbar flex gap-2 overflow-x-auto px-gutter'>
        {complexes.map((c, i) => (
          <li key={c.id}>
            <Ticket
              kicker='Тренировка'
              mark={complexLetter(i)}
              title={c.name}
              active={c.id === activeId}
              onClick={() => setOpened({ complex: c, index: i })}
            >
              <Eyebrow>{pluralize(c.exercises.length, EXERCISE_FORMS)}</Eyebrow>
            </Ticket>
          </li>
        ))}
      </ol>
      <ComplexSheet
        complex={opened}
        onClose={() => setOpened(null)}
        activeId={activeId}
        onPick={onPick}
        pickLabel={pickLabel}
      />
    </ScreenSection>
  )
}
