import { Navigate, Outlet, useLocation } from 'react-router'

import { useMe } from '@/entities/session'
import { useIsAuthenticated } from '@/shared/auth'
import { type AuthLocationState, ROUTES } from '@/shared/config/paths'
import { PageLoader } from '@/shared/ui/kit/PageLoader'
import { QueryState } from '@/shared/ui/kit/QueryState'

const PrivateRoute = () => {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()
  const me = useMe()

  if (!isAuthenticated) {
    // Запоминаем, куда шёл пользователь, чтобы вернуть его туда после входа
    const state: AuthLocationState = { from: location.pathname + location.search }
    return (
      <Navigate
        to={ROUTES.LOGIN}
        replace
        state={state}
      />
    )
  }

  // Профиль нужен всем приватным страницам (роль, список организаций) — ждём его один раз здесь
  if (me.isPending) return <PageLoader />

  if (me.isError) {
    return (
      <div className='mx-auto flex min-h-svh max-w-3xl items-center p-4'>
        <QueryState query={me}>{() => null}</QueryState>
      </div>
    )
  }

  return <Outlet />
}

export default PrivateRoute
