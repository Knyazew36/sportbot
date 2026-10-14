import type { DayToday } from '@/entities/day'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Lead, Poster } from '@/shared/ui/kit/Typography'

import { complexLetter } from '@/entities/program'
import { WeekStreak } from './WeekStreak'

// Нетренировочный день: комплекс по очереди свёрнут, можно всё равно потренироваться (внеплановая, 7.2)
export const RestDay = ({ day }: { day: DayToday }) => {
  const complex = day.complex
  const index = complex ? day.complexes.findIndex(c => c.id === complex.id) : -1

  return (
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
      <WeekStreak
        streak={day.streak}
        week={day.week}
      />
      {complex && (
        <>
          <Rise className='px-gutter'>
            <List>
              <ListRow
                title={complex.name}
                meta={`Следующий на очереди · ${complex.exercises.length} упр.`}
                trail={
                  <Poster
                    as='span'
                    size='2xl'
                    tone='faint'
                  >
                    {complexLetter(Math.max(index, 0))}
                  </Poster>
                }
              />
            </List>
          </Rise>
          <Rise className='px-gutter'>
            <ButtonLink
              to={`${buildPath(ROUTES.WORKOUT)}?complexId=${complex.id}`}
              variant='outline'
              className='w-full'
            >
              Всё равно потренироваться
            </ButtonLink>
          </Rise>
        </>
      )}
    </>
  )
}
