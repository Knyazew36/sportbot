import { SupportWidget } from '@app/support-chat-react'

import { useEffect, useRef } from 'react'

import { getSupportVisitorClient, SUPPORT_ASSET_BASE_URL } from './support-clients'
import './support-theme.css'

interface SupportChatWidgetProps {
  /**
   * ЗАМЕНИТЬ: id текущего пользователя (или null для гостя). Сменился — клиент заново входит в чат,
   * иначе новый пользователь увидел бы переписку прошлого.
   */
  userId: string | number | null
}

/** Плавающий чат поддержки. Рендерить один раз в корневом лейауте приложения. */
export const SupportChatWidget = ({ userId }: SupportChatWidgetProps) => {
  const client = getSupportVisitorClient()
  const previousUser = useRef(userId)

  // Первый показ подключает сам виджет; перезапуск — только когда пользователь сменился (вход, выход)
  useEffect(() => {
    if (previousUser.current === userId) return
    previousUser.current = userId
    void client.restart()
  }, [client, userId])

  // Ушли со страниц с виджетом — сокет не нужен; при возврате виджет подключится снова
  useEffect(() => () => client.stop(), [client])

  return (
    <SupportWidget
      client={client}
      assetBaseUrl={SUPPORT_ASSET_BASE_URL}
    />
  )
}
