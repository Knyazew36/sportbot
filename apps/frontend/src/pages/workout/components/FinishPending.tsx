import { useNavigate } from 'react-router'

import { useEffect } from 'react'

import { useIsOnline } from '@/shared/api'
import { ROUTES } from '@/shared/config/paths'
import { PageLoader } from '@/shared/ui/kit/PageLoader'

/** Сколько ждать ответа на «Завершить», прежде чем отпустить человека на «Сегодня» */
const WAIT_MS = 3000

// Завершение стоит в очереди. При живой сети ответ приходит быстро, и экран тренировки сам уводит в итог.
// Без сети или в плохой — не держим человека: «Сегодня» покажет, что тренировка сохранится позже
export const FinishPending = () => {
  const navigate = useNavigate()
  const online = useIsOnline()

  useEffect(() => {
    const timer = setTimeout(() => navigate(ROUTES.TODAY, { replace: true }), online ? WAIT_MS : 0)
    return () => clearTimeout(timer)
  }, [online, navigate])

  return <PageLoader />
}
