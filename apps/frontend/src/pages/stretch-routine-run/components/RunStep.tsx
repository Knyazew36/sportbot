import { InfoIcon, SkipBackIcon, SkipForwardIcon } from 'lucide-react'

import { useState } from 'react'

import { useProfile } from '@sportbot/api/entities/profile'
import type { StretchRoutine } from '@sportbot/api/entities/stretch-routine'
import { timerEndSignal } from '@/shared/lib/signal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { HoldControls } from '@/widgets/catalog/HoldControls'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'
import { StretchProgress } from '@/widgets/stretch-run/StretchProgress'
import { StretchStepBody } from '@/widgets/stretch-run/StretchStepBody'

import { useStretchRoutineRunFlow } from '../model/use-stretch-routine-run-flow'

export const RunStep = ({ routine }: { routine: StretchRoutine }) => {
  const flow = useStretchRoutineRunFlow(routine)
  const { stretch, index, side } = flow
  const { data: profile } = useProfile()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const ids = routine.stretches.map(s => s.id)
  const key = `${index}-${stretch.id}-${side}`

  return (
    <div className='flex min-h-svh flex-1 flex-col'>
      <Screen
        key={`screen-${key}`}
        header={
          <>
            <TopBar
              back={flow.back}
              title={routine.name}
              subtitle={`${index + 1} из ${ids.length}`}
            />
            <StretchProgress
              ids={ids}
              current={index}
              done={new Set(ids.slice(0, index))}
              mainCount={ids.length}
            />
          </>
        }
        className='gap-5 px-gutter pt-4'
      >
        <StretchStepBody
          stretch={stretch}
          side={side}
          eyebrow={stretch.muscles}
          actions={
            <Button
              variant='outline'
              size='sm'
              onClick={() => setDetailsOpen(true)}
            >
              <InfoIcon />
              Подробнее
            </Button>
          }
        />
      </Screen>
      <HoldControls
        key={`hold-${key}`}
        holdSeconds={stretch.holdSeconds}
        autoStart={side === 2}
        back={{ label: 'Назад', icon: SkipBackIcon, onClick: flow.prev, disabled: index === 0 && side === 1 }}
        next={{
          label: stretch.perSide && side === 1 ? 'Левая' : flow.isLast ? 'Готово' : 'Дальше',
          icon: SkipForwardIcon,
          onClick: flow.next,
        }}
        onEnd={() => profile && timerEndSignal(profile)}
      />
      <ExerciseSheet
        exercise={detailsOpen ? stretch : null}
        kind='stretch'
        onOpenChange={setDetailsOpen}
      />
    </div>
  )
}
