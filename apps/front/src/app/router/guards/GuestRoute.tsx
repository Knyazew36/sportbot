import { Navigate, Outlet, useLocation } from 'react-router'
import { useIsAuthenticated } from '@/shared/auth'
import { ROUTES } from '@/shared/config/paths'
import { env } from '@/env'

const GuestRoute = () => {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (!env.DEMO && isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from ?? ROUTES.HOME
    return <Navigate to={from} replace />
  }

  return <Outlet />
}

export default GuestRoute
