import { ShuffleIcon } from 'lucide-react'

import { useState } from 'react'

import { type DayToday, useSkipDay } from '@/entities/day'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { ComplexExercises } from './ComplexExercises'
import { ComplexPoster } from './ComplexPoster'
import { ComplexQueue } from './ComplexQueue'
import { EveningQuestion } from './EveningQuestion'
import { OtherComplexSheet } from './OtherComplexSheet'
import { WeekStreak } from './WeekStreak'

type TrainingDayProps = {
  day: DayToday
  onPickComplex: (id: number) => void
  onMissed: (suggestPause: boolean) => void
}

// Тренировочный день, тренировки ещё не было: комплекс по очереди, «Другой комплекс», «Сегодня не буду»
export const TrainingDay = ({ day, onPickComplex, onMissed }: TrainingDayProps) => {
  const [otherOpen, setOtherOpen] = useState(false)
  const skip = useSkipDay()
  const complex = day.complex!

  return (
    <>
      {day.eveningAsked && <EveningQuestion onMissed={onMissed} />}

      <ComplexPoster
        complex={complex}
        complexes={day.complexes}
        programName={day.programName}
      />

      <WeekStreak
        streak={day.streak}
        week={day.week}
      />

      <ComplexQueue
        complexes={day.complexes}
        currentId={complex.id}
        byQueue={complex.byQueue}
      />

      <ComplexExercises complex={complex} />

      {/* Подписи переносятся: на узком экране две кнопки в строку не влезают в одну линию */}
      <Rise className='grid grid-cols-2 gap-2 px-5'>
        <Button
          variant='outline'
          size='sm'
          className='h-auto min-h-9 min-w-0 px-2 py-1.5 leading-tight whitespace-normal'
          disabled={day.complexes.length < 2}
          onClick={() => setOtherOpen(true)}
        >
          <ShuffleIcon />
          Другой комплекс
        </Button>
        <ConfirmAction
          title='Сегодня не будешь?'
          description='Запишу пропуск. Бот про сегодняшний день больше не спросит.'
          confirmLabel='Записать пропуск'
          confirmVariant='default'
          onConfirm={() => skip.mutateAsync().then(result => onMissed(result.suggestPause))}
          trigger={
            <Button
              variant='outline'
              size='sm'
              className='h-auto min-h-9 min-w-0 px-2 py-1.5 leading-tight whitespace-normal'
            />
          }
        >
          Сегодня не буду
        </ConfirmAction>
      </Rise>

      <OtherComplexSheet
        open={otherOpen}
        onOpenChange={setOtherOpen}
        programName={day.programName}
        complexes={day.complexes}
        currentId={complex.id}
        onPick={onPickComplex}
      />
    </>
  )
}
