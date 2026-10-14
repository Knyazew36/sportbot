import { useMutation, useQueryClient } from '@tanstack/react-query'

import { dayKeys } from '@/entities/day'
import { pauseControllerEnd } from '@/shared/api/generated/pause/pause'

/** Снять паузу досрочно или вернуться после её срока */
export const useEndPause = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => pauseControllerEnd(),
    meta: { successMessage: 'Паузу снял. Бот снова будет спрашивать про тренировки' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dayKeys.all }),
  })
}
