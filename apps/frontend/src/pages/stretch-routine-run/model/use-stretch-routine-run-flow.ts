import { useNavigate } from 'react-router'

import { useEffect, useRef, useState } from 'react'

import { type StretchRoutine, useFinishStretchSession, useStartStretchSession } from '@sportbot/api/entities/stretch-routine'
import { buildPath, ROUTES } from '@/shared/config/paths'

/** Отдельное занятие: растяжки по шагам и сторонам. Начало и конец пишутся в занятие, статистику тренировок не трогают */
export const useStretchRoutineRunFlow = (routine: StretchRoutine) => {
  const [position, setPosition] = useState<{ index: number; side: 1 | 2 }>({ index: 0, side: 1 })
  const { mutate: start, data: session } = useStartStretchSession()
  const { mutate: finishSession } = useFinishStretchSession()
  const started = useRef(false)
  const navigate = useNavigate()
  const back = buildPath(ROUTES.STRETCH_ROUTINE, { routineId: routine.id })
  const stretch = routine.stretches[position.index]!

  // Эффект срабатывает дважды в StrictMode, а второе занятие создавать нельзя
  useEffect(() => {
    if (started.current) return
    started.current = true
    start(routine.id)
  }, [routine.id, start])

  const finish = () => {
    if (session) finishSession(session.id)
    navigate(back, { replace: true })
  }

  const next = () => {
    if (stretch.perSide && position.side === 1) return setPosition({ ...position, side: 2 })
    if (position.index === routine.stretches.length - 1) return finish()
    setPosition({ index: position.index + 1, side: 1 })
  }

  const prev = () => {
    if (position.side === 2) return setPosition({ ...position, side: 1 })
    if (position.index > 0) setPosition({ index: position.index - 1, side: 1 })
  }

  return {
    routine,
    stretch,
    index: position.index,
    side: position.side,
    isLast: position.index === routine.stretches.length - 1 && (!stretch.perSide || position.side === 2),
    back,
    next,
    prev,
  }
}
