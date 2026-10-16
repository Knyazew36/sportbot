import { CloudOffIcon } from 'lucide-react'

import type { DayToday } from '@/entities/day'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography'

import { WeekStreak } from './WeekStreak'

// Тренировку завершили без сети: сервер ещё считает её идущей, а человек уже закончил.
// Вместо «Продолжить» — спокойное «засчитается само», засчитанный день появится, когда очередь дойдёт
export const FinishQueuedDay = ({ day }: { day: DayToday }) => (
  <>
    <Rise className='px-gutter'>
      <Eyebrow
        as='p'
        tone='primary'
      >
        Тренировка завершена
      </Eyebrow>
      <Lead className='mt-4'>засчитаем —</Lead>
      <Poster
        as='h1'
        size='4xl'
        tone='primary'
        fit
        className='mt-1'
      >
        {day.workout!.complexName}
      </Poster>
      <Text
        size='sm'
        tone='muted'
        className='mt-4 flex items-center gap-1.5'
      >
        <CloudOffIcon className='size-3.5 shrink-0' />
        Сохранится, когда появится сеть. Приложение можно закрыть.
      </Text>
    </Rise>
    <WeekStreak
      streak={day.streak}
      week={day.week}
    />
  </>
)
