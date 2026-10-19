import type { DayToday } from '@/entities/day'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Lead, Poster } from '@/shared/ui/kit/Typography'

import { ForgottenMuscles } from './ForgottenMuscles'
import { NextUp } from './NextUp'
import { WeekStreak } from './WeekStreak'

// Нетренировочный день: когда следующая и что там; можно всё равно потренироваться (внеплановая, 7.2)
export const RestDay = ({ day }: { day: DayToday }) => (
  <>
    <Rise className='px-gutter'>
      <Lead>сегодня —</Lead>
      <Poster
        as='h1'
        size='hero'
        tone='primary'
        fit
      >
        отдых
      </Poster>
      <div className='sb-lanes mt-4 h-24 opacity-40' />
    </Rise>
    {/* «Потренироваться» — в липком низу экрана, над меню */}
    <NextUp
      day={day}
      label='следующая по расписанию'
    />
    <WeekStreak
      week={day.week}
    />
    <ForgottenMuscles />
  </>
)
