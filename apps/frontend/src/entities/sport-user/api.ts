import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { PERSIST_GC_TIME } from '@/shared/api'
import { miniappControllerAllowWriteAccess, miniappControllerMe } from '@/shared/api/generated/miniapp/miniapp'
import type { MiniappMeResponseDto } from '@/shared/api/generated/model'

export type SportUser = MiniappMeResponseDto

export const sportUserKeys = {
  me: ['sport-user', 'me'] as const,
}

/** Кто открыл приложение: профиль, админ ли, пройден ли первый запуск */
export const useSportUser = () =>
  useQuery({
    queryKey: sportUserKeys.me,
    queryFn: () => miniappControllerMe(),
    // Блокировка и плохие данные запуска повтором не лечатся; сеть — повторит кнопка «Повторить»
    retry: false,
    // Открыть приложение в зале без сети: гард входа пускает по сохранённому профилю
    meta: { persist: true },
    gcTime: PERSIST_GC_TIME,
  })

/** Пользователь разрешил боту писать штатным запросом мессенджера */
export const useAllowWriteAccess = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => miniappControllerAllowWriteAccess(),
    meta: { successMessage: 'Бот сможет задавать вопросы и напоминать' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sportUserKeys.me }),
  })
}
