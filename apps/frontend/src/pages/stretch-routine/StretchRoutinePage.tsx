import { ArrowRightIcon } from 'lucide-react'
import { useParams } from 'react-router'

import { useStretchRoutine } from '@sportbot/api/entities/stretch-routine'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Lead, Poster } from '@/shared/ui/kit/Typography'

import { RoutineStretches } from './components/RoutineStretches'

// Карточка комплекса: состав и старт занятия
const StretchRoutinePage = () => {
  const routineId = Number(useParams().routineId)
  const routine = useStretchRoutine(routineId)
  return (
    <QueryScreen query={routine}>
      {data => (
        <Screen
          header={
            <TopBar
              back={ROUTES.STRETCH_ROUTINES}
              title={data.name}
            />
          }
          footer={
            <StickyFooter>
              <ButtonLink
                to={buildPath(ROUTES.STRETCH_ROUTINE_RUN, { routineId })}
                size='lg'
              >
                Начать
                <ArrowRightIcon
                  className='size-7'
                  strokeWidth={2.5}
                />
              </ButtonLink>
            </StickyFooter>
          }
          className='px-gutter'
        >
          <Rise>
            <Lead>{data.description}</Lead>
            <Poster
              as='p'
              size='display'
              tone='primary'
              numeric
            >
              ~{data.minutes} мин
            </Poster>
          </Rise>
          <RoutineStretches stretches={data.stretches} />
        </Screen>
      )}
    </QueryScreen>
  )
}

export default StretchRoutinePage
