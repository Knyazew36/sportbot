import { ArrowRightIcon } from 'lucide-react'

import { useState } from 'react'

import { type DayToday, usePickComplex, useToday } from '@/entities/day'
import { useSportUser } from '@/entities/sport-user'
import { useFinishQueued } from '@/entities/workout'
import { ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'

import { DoneDay } from './components/DoneDay'
import { FinishQueuedDay } from './components/FinishQueuedDay'
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
    return { label: 'Начать', to: `${ROUTES.WORKOUT}?complexId=${day.complex.id}`, variant: 'success' }
  // Внеплановая тренировка в день отдыха (7.2) — зелёная
  if (day.state === 'REST' && day.complex)
    return {
      label: 'Потренироваться',
      to: `${ROUTES.WORKOUT}?complexId=${day.complex.id}`,
      variant: 'success',
    }
  if (day.state === 'IN_PROGRESS') return { label: 'Продолжить', to: ROUTES.WORKOUT }
  // Пропуск ещё можно закрыть: тренировка сегодня сама снимет отметку (business-tz, 7.2)
  if (day.state === 'MISSED' && day.next)
    return { label: 'Потренироваться', to: `${ROUTES.WORKOUT}?complexId=${day.next.complexId}`, variant: 'success' }
  // Заминку предлагает только итог тренировки, на главной её нет
  return null
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

// Главный экран (frontend-tz, 7): одно из состояний дня, серия, неделя и что дальше
const TodayPage = () => {
  const today = useToday()
  const pick = usePickComplex()
  const me = useSportUser()
  // Три пропуска подряд — ответ на «не буду» один раз предлагает паузу
  const [suggestPause, setSuggestPause] = useState(false)

  // Завершение ждёт сети: сервер ещё говорит «идёт», но продолжать уже нечего
  const finishQueued = useFinishQueued(today.data?.workout?.id)

  const action = today.data && !finishQueued ? cta(today.data) : null

  return (
    <Screen
      header={
        <>
          {/* Тренировка идёт — место даты занимает живая полоса оболочки */}
          {!(today.data?.state === 'IN_PROGRESS' && !finishQueued) && (
            <ScreenHeader
              title={today.data ? capitalize(formatDate(today.data.date, 'EEEE · d MMMM')) : 'Сегодня'}
            />
          )}
          {me.data && !me.data.canMessage && <PermissionBanner />}
        </>
      }
      footer={
        action && (
          <StickyFooter>
            <ButtonLink
              to={action.to}
              variant={action.variant}
              size='lg'
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
                onPickComplex={pick.mutate}
                onMissed={setSuggestPause}
              />
            )}
            {day.state === 'REST' && <RestDay day={day} />}
            {day.state === 'IN_PROGRESS' &&
              day.workout &&
              (finishQueued ? <FinishQueuedDay day={day} /> : <InProgressDay day={day} />)}
            {day.state === 'DONE' && <DoneDay day={day} />}
            {day.state === 'MISSED' && (
              <MissedDay
                day={day}
                suggestPause={suggestPause}
              />
            )}
            {day.state === 'PAUSE' && day.pause && <PauseDay day={day} />}
            {/* Комплекс дня не нашёлся — программа пустая */}
            {(day.state === 'NO_PROGRAM' || (day.state === 'TRAINING' && !day.complex)) && <NoProgramDay />}
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default TodayPage
