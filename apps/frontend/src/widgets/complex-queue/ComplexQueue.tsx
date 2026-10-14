import { useState } from 'react'

import { complexLetter, type ProgramComplex } from '@/entities/program'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Ticket } from '@/shared/ui/kit/Ticket'
import { Eyebrow } from '@/shared/ui/kit/Typography'

import { ComplexSheet } from './ComplexSheet'

type ComplexQueueProps = {
  complexes: ProgramComplex[]
  /** Какой билет подсвечен: следующий по очереди или выбранный на сегодня */
  activeId: number | undefined
  aside: string
}

// Очередь комплексов программы билетами. Билет открывает состав комплекса в шторке
export const ComplexQueue = ({ complexes, activeId, aside }: ComplexQueueProps) => {
  const [opened, setOpened] = useState<{ complex: ProgramComplex; index: number } | null>(null)

  return (
    <ScreenSection
      title='Очередь комплексов'
      aside={aside}
      bleed
    >
      <ol className='no-scrollbar flex gap-2 overflow-x-auto px-gutter'>
        {complexes.map((c, i) => (
          <li key={c.id}>
            <Ticket
              mark={complexLetter(i)}
              title={c.name}
              active={c.id === activeId}
              onClick={() => setOpened({ complex: c, index: i })}
            >
              <Eyebrow>{c.exercises.length} упр.</Eyebrow>
            </Ticket>
          </li>
        ))}
      </ol>
      <ComplexSheet
        complex={opened}
        onClose={() => setOpened(null)}
      />
    </ScreenSection>
  )
}
