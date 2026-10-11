import { Navigate, Outlet, useLocation } from 'react-router'
import { useIsAuthenticated } from '@/shared/auth'
import { ROUTES } from '@/shared/config/paths'
import { env } from '@/env'

const PrivateRoute = () => {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (!env.DEMO && !isAuthenticated) {
    // Запоминаем, куда шёл пользователь, чтобы вернуть его туда после входа
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}

export default PrivateRoute
