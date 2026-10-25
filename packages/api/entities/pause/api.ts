import { useMutation, useQueryClient } from '@tanstack/react-query'

import { dayKeys } from '../day'
import { profileKeys } from '../profile'
import { pauseControllerEnd, pauseControllerStart } from '../../generated/pause/pause'

// Пауза видна и на «Сегодня», и в профиле
const useInvalidatePause = () => {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: dayKeys.all })
    void queryClient.invalidateQueries({ queryKey: profileKeys.profile })
  }
}

/** Пауза «до даты» (endDate, ГГГГ-ММ-ДД) или «до отмены» (null): бот молчит, серия не сгорает */
export const useStartPause = () => {
  const invalidate = useInvalidatePause()
  return useMutation({
    mutationFn: (endDate: string | null) => pauseControllerStart({ endDate }),
    meta: { successMessage: 'Пауза поставлена. Бот замолчит до её конца', inlineFieldErrors: true },
    onSuccess: invalidate,
  })
}

/** Снять паузу досрочно или вернуться после её срока */
export const useEndPause = () => {
  const invalidate = useInvalidatePause()
  return useMutation({
    mutationFn: () => pauseControllerEnd(),
    meta: { successMessage: 'Паузу снял. Бот снова будет спрашивать про тренировки' },
    onSuccess: invalidate,
  })
}
