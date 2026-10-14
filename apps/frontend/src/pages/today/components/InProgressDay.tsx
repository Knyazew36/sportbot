import { XIcon } from 'lucide-react'

import type { DayToday } from '@/entities/day'
import { useDiscardWorkout } from '@/entities/workout'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { Rise } from '@/shared/ui/kit/Reveal'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { WeekStreak } from './WeekStreak'

// Тренировка идёт: начата в боте или приложении, продолжается где удобно (frontend-tz, 4.1)
export const InProgressDay = ({ day }: { day: DayToday }) => {
  const workout = day.workout!
  const discard = useDiscardWorkout()

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
            />
          }
          title='Отменить тренировку?'
          description={
            workout.done
              ? `Записанные подходы (${workout.done} из ${workout.total} упражнений) удалятся. Очередь комплексов не сдвинется.`
              : 'Тренировка удалится, очередь комплексов не сдвинется.'
          }
          confirmLabel='Отменить тренировку'
          onConfirm={() => discard.mutateAsync(workout.id)}
        >
          <XIcon />
          Отменить тренировку
        </ConfirmAction>
      </Rise>
    </>
  )
}
