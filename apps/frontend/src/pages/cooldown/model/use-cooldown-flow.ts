import { useNavigate } from 'react-router'

import { useEffect, useRef, useState } from 'react'

import { type Cooldown, useCooldownFinish, useCooldownStart } from '@sportbot/api/entities/workout'
import { useExcludeCooldownStretch } from '@/features/exclude-stretch/useExcludeCooldownStretch'
import { buildPath, ROUTES } from '@/shared/config/paths'

export type CooldownPhase = { kind: 'overview' } | { kind: 'step'; index: number; side: 1 | 2 } | { kind: 'more' }

export type OpenedStretch = { id: number; name: string }

/**
 * Логика заминки (frontend-tz, 9): обзор → растяжки по шагам (по сторонам) → вопрос «есть время ещё?» → итог.
 * Состав и порядок — с сервера, при повторном открытии не меняется. В статистику идёт только время заминки:
 * начало первой растяжки и выход к итогу. start — пришли с предложения после финиша: сразу первая растяжка
 */
export const useCooldownFlow = (cooldown: Cooldown, start: boolean) => {
  const [phase, setPhase] = useState<CooldownPhase>(
    start ? { kind: 'step', index: 0, side: 1 } : { kind: 'overview' },
  )
  const [listOpen, setListOpen] = useState(false)
  const [opened, setOpened] = useState<OpenedStretch | null>(null)
  const all = [...cooldown.main, ...cooldown.optional]
  const back = buildPath(ROUTES.WORKOUT_SUMMARY, { workoutId: cooldown.workoutId })
  const { mutate: markStart } = useCooldownStart()
  const { mutate: markFinish } = useCooldownFinish()
  const marked = useRef<{ start?: boolean; finish?: boolean }>({})
  const exclude = useExcludeCooldownStretch()
  const navigate = useNavigate()

  // Отметка один раз за открытие; повторное открытие сервер не перезапишет
  useEffect(() => {
    if (phase.kind === 'step' && !marked.current.start) {
      marked.current.start = true
      markStart(cooldown.workoutId)
    }
  }, [phase.kind, cooldown.workoutId, markStart])

  // Без промежуточного «Готово» — сразу к итогу, время заминки видно там
  const finish = () => {
    if (marked.current.start && !marked.current.finish) {
      marked.current.finish = true
      markFinish(cooldown.workoutId)
    }
    navigate(back, { replace: true })
  }

  const go = (index: number) => setPhase({ kind: 'step', index, side: 1 })

  const next = () => {
    if (phase.kind !== 'step') return
    const stretch = all[phase.index]!
    if (stretch.perSide && phase.side === 1) return setPhase({ ...phase, side: 2 })
    // После основного блока — вопрос, хватит ли времени на остальное (frontend-tz, 9.1)
    if (phase.index === cooldown.main.length - 1 && cooldown.optional.length) return setPhase({ kind: 'more' })
    if (phase.index < all.length - 1) return go(phase.index + 1)
    finish()
  }

  const prev = () => {
    if (phase.kind !== 'step') return
    if (phase.side === 2) return setPhase({ ...phase, side: 1 })
    if (phase.index > 0) go(phase.index - 1)
  }

  // Замена встаёт на место убранной; если замены не нашлось — список короче, номер поправляем
  const excludeStretch = (stretchId: number) =>
    exclude.mutate(
      { workoutId: cooldown.workoutId, stretchId },
      {
        onSuccess: next => {
          setOpened(null)
          if (phase.kind !== 'step') return
          const length = next.main.length + next.optional.length
          const wasMain = phase.index < cooldown.main.length
          if (phase.index >= length) return finish()
          if (wasMain && phase.index >= next.main.length && next.optional.length) return setPhase({ kind: 'more' })
          setPhase({ kind: 'step', index: phase.index, side: 1 })
        },
      },
    )

  return {
    cooldown,
    phase,
    all,
    back,
    listOpen,
    setListOpen,
    opened,
    open: (stretch: OpenedStretch) => setOpened({ id: stretch.id, name: stretch.name }),
    closeOpened: () => setOpened(null),
    excludePending: exclude.isPending,
    excludeStretch,
    go,
    next,
    prev,
    finish,
  }
}

export type CooldownFlow = ReturnType<typeof useCooldownFlow>
