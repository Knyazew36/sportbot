import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { profileControllerRemove } from '@/shared/api/generated/profile/profile'
import { ROUTES } from '@/shared/config/paths'

/**
 * «Удалить мои данные» (business-tz, 15): запрос, сброс всего кэша — он про стёртого пользователя —
 * и возврат к первому запуску. Слово «удалить» вводят в подтверждении, бэк проверяет его ещё раз
 */
export const useDeleteAccount = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => profileControllerRemove({ confirmation: 'удалить' }),
    meta: { successMessage: 'Данные удалены. Начнём сначала' },
    onSuccess: async () => {
      await queryClient.resetQueries()
      navigate(ROUTES.ONBOARDING, { replace: true })
    },
  })
}
