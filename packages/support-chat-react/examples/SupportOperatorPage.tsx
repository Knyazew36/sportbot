import { SupportInbox } from '@app/support-chat-react'

import { useEffect, useState } from 'react'

import { createSupportOperatorClient, SUPPORT_ASSET_BASE_URL } from './support-clients'
import './support-theme.css'

const CONVERSATION_PARAM = 'conversation'

interface SupportOperatorPageProps {
  /** ЗАМЕНИТЬ: id текущего оператора — чтобы не показывать «Взять себе» на его же диалогах. */
  operatorId: number
  /** ЗАМЕНИТЬ: тост проекта для ошибок действий (взять, закрыть, …). */
  onError?: (error: unknown) => void
}

const readSelected = () => Number(new URLSearchParams(location.search).get(CONVERSATION_PARAM)) || null

/**
 * Инбокс операторов. Доступ к странице проверяет роутер проекта; сервер всё равно отдаёт инбокс
 * только операторам (SupportIdentity.resolveOperator).
 *
 * Открытый диалог — в адресе (?conversation=42): на него удобно вести ссылкой из оповещения.
 * Здесь — через History API; в проекте с роутером заменить на его хук параметров адреса.
 */
const SupportOperatorPage = ({ operatorId, onError }: SupportOperatorPageProps) => {
  const [client] = useState(createSupportOperatorClient)
  const [selectedId, setSelectedId] = useState(readSelected)

  useEffect(() => {
    const onPop = () => setSelectedId(readSelected())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const select = (id: number | null) => {
    const url = new URL(location.href)
    if (id) url.searchParams.set(CONVERSATION_PARAM, String(id))
    else url.searchParams.delete(CONVERSATION_PARAM)
    history.pushState(null, '', url)
    setSelectedId(id)
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100svh', padding: 16 }}>
      <SupportInbox
        client={client}
        operatorId={operatorId}
        selectedId={selectedId}
        onSelect={select}
        onError={onError}
        assetBaseUrl={SUPPORT_ASSET_BASE_URL}
        className='support-inbox'
      />
    </main>
  )
}

export default SupportOperatorPage
