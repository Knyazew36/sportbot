import { ArrowRightIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { useState } from 'react'

import { type DayToday, useToday } from '@/entities/day'
import { useSportUser } from '@/entities/sport-user'
import { isCooldownClosed } from '@/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'

import { DoneDay } from './components/DoneDay'
import { InProgressDay } from './components/InProgressDay'
import { MissedDay } from './components/MissedDay'
import { NoProgramDay } from './components/NoProgramDay'
import { PauseDay } from './components/PauseDay'
import { PermissionBanner } from './components/PermissionBanner'
import { RestDay } from './components/RestDay'
import { TrainingDay } from './components/TrainingDay'

type Cta = { label: string; to: string; variant?: 'success' }

// Главное действие дня у большого пальца
const cta = (day: DayToday): Cta | null => {
  if (day.state === 'TRAINING' && day.complex)
    return { label: 'Начать', to: `${ROUTES.WORKOUT}?complexId=${day.complex.id}` }
  // Внеплановая тренировка в день отдыха (7.2) — зелёная
  if (day.state === 'REST' && day.complex)
    return {
      label: 'Потренироваться',
      to: `${ROUTES.WORKOUT}?complexId=${day.complex.id}`,
      variant: 'success',
    }
  if (day.state === 'IN_PROGRESS') return { label: 'Продолжить', to: ROUTES.WORKOUT }
  if (day.state === 'DONE' && day.workout && !isCooldownClosed(day.workout.id))
    return { label: 'Заминка', to: buildPath(ROUTES.COOLDOWN, { workoutId: day.workout.id }) }
  return null
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

// Главный экран (frontend-tz, 7): одно из состояний дня, серия и неделя
const TodayPage = () => {
  const [params, setParams] = useSearchParams()
  const complexId = Number(params.get('complexId')) || undefined
  const today = useToday(complexId)
  const me = useSportUser()
  // Три пропуска подряд — ответ на «не буду» один раз предлагает паузу
  const [suggestPause, setSuggestPause] = useState(false)

  const pickComplex = (id: number) => setParams({ complexId: String(id) }, { replace: true })
  const action = today.data ? cta(today.data) : null

  return (
    <Screen
      header={
        <>
          <ScreenHeader
            title={today.data ? capitalize(formatDate(today.data.date, 'EEEE · d MMMM')) : 'Сегодня'}
            aside={today.data?.programName ?? undefined}
          />
          {me.data && !me.data.canMessage && <PermissionBanner />}
        </>
      }
      footer={
        action && (
          <StickyFooter>
            <ButtonLink
              to={action.to}
              variant={action.variant}
              size='xl'
            >
              {action.label}
              <ArrowRightIcon
                className='size-7'
                strokeWidth={2.5}
              />
            </ButtonLink>
          </StickyFooter>
        )
      }
    >
      <QueryScreen query={today}>
        {day => (
          <>
            {day.state === 'TRAINING' && day.complex && (
              <TrainingDay
                day={day}
                onPickComplex={pickComplex}
                onMissed={setSuggestPause}
              />
            )}
            {day.state === 'REST' && <RestDay day={day} />}
            {day.state === 'IN_PROGRESS' && day.workout && <InProgressDay day={day} />}
            {day.state === 'DONE' && <DoneDay day={day} />}
            {day.state === 'MISSED' && (
              <MissedDay
                day={day}
                suggestPause={suggestPause}
              />
            )}
            {day.state === 'PAUSE' && day.pause && <PauseDay pause={day.pause} />}
            {/* Комплекс дня не нашёлся — программа пустая */}
            {(day.state === 'NO_PROGRAM' || (day.state === 'TRAINING' && !day.complex)) && <NoProgramDay />}
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default TodayPage
