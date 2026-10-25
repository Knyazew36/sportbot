import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  linkControllerCreateCode,
  linkControllerNotify,
  linkControllerState,
  linkControllerUnlink,
} from '../../generated/link/link'
import type { LinkNotifyDto, LinkStateResponseDto } from '../../generated/model'

export type LinkState = LinkStateResponseDto
export type Messenger = LinkState['linked'][number]

export const MESSENGER_LABEL: Record<Messenger, string> = { TELEGRAM: 'Telegram', MAX: 'MAX' }

export const linkKeys = {
  state: ['link', 'state'] as const,
}

/** Привязанные мессенджеры и куда слать вопросы (business-tz, 22.4) */
export const useLinkState = () =>
  useQuery({
    queryKey: linkKeys.state,
    queryFn: () => linkControllerState(),
    // Привязку завершают во втором мессенджере — при возврате в приложение состояние уже другое
    staleTime: 0,
  })

/** Одноразовая ссылка на бота во втором мессенджере: перейти по ней — и аккаунты объединятся */
export const useCreateLinkCode = () =>
  useMutation({
    mutationFn: () => linkControllerCreateCode(),
    // Ссылка сразу показывается в шторке
    meta: { skipSuccessToast: true },
  })

export const useUnlink = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channel: Messenger) => linkControllerUnlink({ channel }),
    meta: { successMessage: 'Мессенджер отвязан' },
    onSuccess: state => queryClient.setQueryData(linkKeys.state, state),
  })
}

export const useSetNotify = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channels: LinkNotifyDto['channels']) => linkControllerNotify({ channels }),
    meta: { successMessage: 'Вопросы будут приходить туда' },
    onSuccess: state => queryClient.setQueryData(linkKeys.state, state),
  })
}
