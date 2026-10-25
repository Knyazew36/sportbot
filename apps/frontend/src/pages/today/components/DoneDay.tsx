import { ChartNoAxesColumnIcon, PlusIcon } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useState } from 'react'

import type { DayToday } from '@sportbot/api/entities/day'
import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { DoneHero } from './DoneHero'
import { ForgottenMuscles } from './ForgottenMuscles'
import { FriendsToday } from './FriendsToday'
import { NextUp } from './NextUp'
import { OtherComplexSheet } from './OtherComplexSheet'
import { WeekStreak } from './WeekStreak'
import { WorkoutTotals } from './WorkoutTotals'

// Тренировка засчитана: серия, итог с рекордами, что дальше, неделя, друзья. Ещё одна тренировка
// (внеплановая, как в боте) или статистика — внизу
export const DoneDay = ({ day }: { day: DayToday }) => {
  const navigate = useNavigate()
  const [pickOpen, setPickOpen] = useState(false)

  return (
    <>
      <DoneHero day={day} />

      {/* Без тренировки — день отмечен исправлением «тренировка была» */}
      {day.workout && (
        <WorkoutTotals
          workoutId={day.workout.id}
          complexName={day.workout.complexName}
        />
      )}

      <NextUp day={day} />
      <WeekStreak week={day.week} />
      <ForgottenMuscles />
      <FriendsToday />

      <Rise className='grid grid-cols-2 gap-2 px-gutter'>
        <Button
          variant='outline'
          size='sm'
          className='h-auto min-h-9 min-w-0 px-2 py-1.5 leading-tight whitespace-normal'
          disabled={!day.complexes.length}
          onClick={() => setPickOpen(true)}
        >
          <PlusIcon />
          Ещё одна тренировка
        </Button>
        <ButtonLink
          to={ROUTES.STATS}
          variant='outline'
          size='sm'
          className='h-auto min-h-9 min-w-0 px-2 py-1.5 leading-tight whitespace-normal'
        >
          <ChartNoAxesColumnIcon />
          Статистика
        </ButtonLink>
      </Rise>

      <OtherComplexSheet
        open={pickOpen}
        onOpenChange={setPickOpen}
        programName={day.programName}
        complexes={day.complexes}
        currentId={-1}
        onPick={id => navigate(`${ROUTES.WORKOUT}?complexId=${id}`)}
      />
    </>
  )
}
