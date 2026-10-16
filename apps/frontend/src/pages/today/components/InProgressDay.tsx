import { XIcon } from 'lucide-react'

import type { DayToday } from '@/entities/day'
import { useDiscardWorkout } from '@/entities/workout'
import { useIsOnline } from '@/shared/api'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { Rise } from '@/shared/ui/kit/Reveal'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { WeekStreak } from './WeekStreak'

import { pluralize } from '@front-cmdt/utils/pluralize'
import { EXERCISE_OF_FORMS } from '@/shared/lib/plural-forms'

// Тренировка идёт: начата в боте или приложении, продолжается где удобно (frontend-tz, 4.1)
export const InProgressDay = ({ day }: { day: DayToday }) => {
  const workout = day.workout!
  const discard = useDiscardWorkout()
  // Отмена удаляет тренировку на сервере — без сети её не сделать
  const online = useIsOnline()

  return (
    <>
      <Rise className='px-gutter'>
        <Eyebrow
          as='p'
          tone='primary'
        >
          Тренировка идёт
        </Eyebrow>
        <Lead className='mt-4'>сейчас —</Lead>
        <Poster
          as='h1'
          size='4xl'
          tone='primary'
          fit
          className='mt-1'
        >
          {workout.complexName}
        </Poster>
        <StatGrid
          className='mt-4'
          items={[
            { label: 'сделано', value: workout.done },
            { label: 'из', value: workout.total },
          ]}
        />
      </Rise>
      <WeekStreak
        streak={day.streak}
        week={day.week}
      />
      {/* Отмена — как «Отменить» в боте: тренировка удаляется, очередь комплексов не сдвигается */}
      <Rise className='px-gutter'>
        <ConfirmAction
          trigger={
            <Button
              variant='destructive'
              className='w-full'
              disabled={!online}
            />
          }
          title='Отменить тренировку?'
          description={
            workout.done
              ? `Записанные подходы (${workout.done} из ${pluralize(workout.total, EXERCISE_OF_FORMS)}) удалятся. Очередь комплексов не сдвинется.`
              : 'Тренировка удалится, очередь комплексов не сдвинется.'
          }
          confirmLabel='Отменить тренировку'
          onConfirm={() => discard.mutateAsync(workout.id)}
        >
          <XIcon />
          {online ? 'Отменить тренировку' : 'Отменить · нужна сеть'}
        </ConfirmAction>
      </Rise>
    </>
  )
}
