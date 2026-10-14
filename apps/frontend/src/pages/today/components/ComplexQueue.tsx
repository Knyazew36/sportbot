import type { DayToday } from '@/entities/day'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Ticket } from '@/shared/ui/kit/Ticket'

import { complexLetter } from './complex-letter'

// Очередь комплексов программы: выбранный на сегодня подсвечен
export const ComplexQueue = ({
  complexes,
  currentId,
  byQueue,
}: {
  complexes: DayToday['complexes']
  currentId: number
  byQueue: boolean
}) => (
  <ScreenSection
    title='Очередь комплексов'
    aside={byQueue ? 'следующий подсвечен' : 'выбран вручную'}
    bleed
  >
    <ol className='no-scrollbar flex gap-2 overflow-x-auto px-5'>
      {complexes.map((c, i) => (
        <li key={c.id}>
          <Ticket
            mark={complexLetter(i)}
            title={c.name}
            active={c.id === currentId}
          />
        </li>
      ))}
    </ol>
  </ScreenSection>
)
