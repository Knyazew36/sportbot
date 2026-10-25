import { Navigate, useLocation, useNavigate } from 'react-router'

import { useEffect, useRef } from 'react'

import { useAdminCounters } from '@sportbot/api/entities/admin'
import { useSportUser } from '@sportbot/api/entities/sport-user'
import { EntryErrorScreen } from '@/pages/entry/EntryErrorScreen'
import { getApiErrorCode, getApiErrorStatus } from '@/shared/api'
import { ROUTES } from '@/shared/config/paths'
import { useMessengerTheme } from '@/shared/lib/hooks/use-messenger-theme'
import { getMiniappAuthorization, getMiniappStartParam } from '@/shared/miniapp'
import { startRoute } from '@/shared/miniapp/start-route'
import { PageLoader } from '@/shared/ui/kit/PageLoader'
import { LiveWorkoutBar } from '@/widgets/miniapp/LiveWorkoutBar'
import { MiniAppShell } from '@/widgets/miniapp/MiniAppShell'
import { MINIAPP_NAV } from '@/widgets/miniapp/nav'

// Вход в Mini App только из бота (frontend-tz, 5): узнаём пользователя по данным запуска мессенджера,
// заблокированному не показываем ничего, незаконченный первый запуск открываем с того же шага
// Кнопка бота «Открыть в приложении» ведёт сразу на свой экран (frontend-tz, 5.1). Один раз за запуск
// и только после первого запуска: незаконченная настройка важнее
const useStartRoute = (onboarded: boolean) => {
  const navigate = useNavigate()
  const done = useRef(false)

  useEffect(() => {
    if (!onboarded || done.current) return
    done.current = true
    const route = startRoute(getMiniappStartParam())
    if (route) navigate(route, { replace: true })
  }, [onboarded, navigate])
}

const MiniappGate = () => {
  const me = useSportUser()
  const { pathname } = useLocation()
  useStartRoute(me.data?.onboarded ?? false)
  // Что ждёт реакции администратора: заявки, жалобы и программы на проверке — числом на пункте «Админ»
  const counters = useAdminCounters({ enabled: me.data?.isAdmin ?? false })
  const adminPending =
    (counters.data?.requests ?? 0) + (counters.data?.complaints ?? 0) + (counters.data?.programReviews ?? 0)

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
      badges={{ [ROUTES.ADMIN]: adminPending }}
      liveBar={onboarded && <LiveWorkoutBar />}
    />
  )
}

const MiniappRoute = () => {
  useMessengerTheme()

  if (!getMiniappAuthorization()) return <EntryErrorScreen reason='outside' />

  return <MiniappGate />
}

export default MiniappRoute
