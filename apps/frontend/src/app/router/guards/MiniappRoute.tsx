import { Navigate, useLocation } from 'react-router'

import { useSportUser } from '@/entities/sport-user'
import { EntryErrorScreen } from '@/pages/entry/EntryErrorScreen'
import { getApiErrorCode, getApiErrorStatus } from '@/shared/api'
import { ROUTES } from '@/shared/config/paths'
import { useMessengerTheme } from '@/shared/lib/hooks/use-messenger-theme'
import { getMiniappAuthorization } from '@/shared/miniapp'
import { PageLoader } from '@/shared/ui/kit/PageLoader'
import { MiniAppShell } from '@/widgets/miniapp/MiniAppShell'
import { MINIAPP_NAV } from '@/widgets/miniapp/nav'

// Вход в Mini App только из бота (frontend-tz, 5): узнаём пользователя по данным запуска мессенджера,
// заблокированному не показываем ничего, незаконченный первый запуск открываем с того же шага
const MiniappGate = () => {
  const me = useSportUser()
  const { pathname } = useLocation()

  if (me.isPending) return <PageLoader />

  if (me.isError) {
    if (getApiErrorCode(me.error) === 'BLOCKED') return <EntryErrorScreen reason='blocked' />
    const status = getApiErrorStatus(me.error)
    // 401: подпись данных запуска не сошлась или они протухли — заново открыть из бота
    if (status === 401) return <EntryErrorScreen reason='outside' />
    return (
      <EntryErrorScreen
        reason='offline'
        onRetry={() => void me.refetch()}
        retrying={me.isRefetching}
      />
    )
  }

  const { onboarded, isAdmin } = me.data
  if (!onboarded && pathname !== ROUTES.ONBOARDING)
    return (
      <Navigate
        to={ROUTES.ONBOARDING}
        replace
      />
    )
  if (onboarded && pathname === ROUTES.ONBOARDING)
    return (
      <Navigate
        to={ROUTES.TODAY}
        replace
      />
    )
  if (!isAdmin && pathname.startsWith(ROUTES.ADMIN))
    return (
      <Navigate
        to={ROUTES.TODAY}
        replace
      />
    )

  return (
    <MiniAppShell
      nav={MINIAPP_NAV}
      isAdmin={isAdmin}
    />
  )
}

const MiniappRoute = () => {
  useMessengerTheme()

  if (!getMiniappAuthorization()) return <EntryErrorScreen reason='outside' />

  return <MiniappGate />
}

export default MiniappRoute
