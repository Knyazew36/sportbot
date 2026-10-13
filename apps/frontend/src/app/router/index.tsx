import { createBrowserRouter, type LoaderFunctionArgs, redirect, type RouteObject } from 'react-router'

import RootLayout from '@/app/layouts/RootLayout'
import { getLastOrganizationId, setOrganizationId } from '@/shared/api'
import { isAuthenticated } from '@/shared/auth'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { PageLoader } from '@/shared/ui/kit/PageLoader'

import GuestRoute from './guards/GuestRoute'
import PrivateRoute from './guards/PrivateRoute'
import RequireAbility from './guards/RequireAbility'
import RouteError from './RouteError'
import { type AppRoute, appRoutes, guestRoutes, privateRoutes, publicRoutes } from './routes'

const toRouteObject = ({ path, Component, lazy, can }: AppRoute): RouteObject => {
  const route: RouteObject = lazy
    ? { path, lazy: () => lazy().then(m => ({ Component: m.default })) }
    : { path, Component }

  return can
    ? {
        element: (
          <RequireAbility
            I={can[0]}
            a={can[1]}
          />
        ),
        children: [route],
      }
    : route
}

// Корень сайта: в организацию прошлого визита, а без неё — к выбору рабочей области
const homeLoader = () => {
  if (!isAuthenticated()) return redirect(ROUTES.LOGIN)
  const orgId = getLastOrganizationId()
  return redirect(orgId ? buildPath(ROUTES.DASHBOARD, { orgId }) : ROUTES.WORKSPACES)
}

// Выполняется до рендера страниц кабинета: их запросы уже уходят с заголовком организации
const organizationLoader = ({ params }: LoaderFunctionArgs) => {
  const orgId = Number(params.orgId)
  if (!Number.isInteger(orgId) || orgId <= 0) throw new Response(null, { status: 404 })
  setOrganizationId(orgId)
  return null
}

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    ErrorBoundary: RouteError,
    HydrateFallback: PageLoader,
    children: [
      { path: ROUTES.HOME, loader: homeLoader },
      { Component: GuestRoute, children: guestRoutes.map(toRouteObject) },
      {
        Component: PrivateRoute,
        children: [
          {
            path: ROUTES.APP,
            loader: organizationLoader,
            lazy: () => import('@/widgets/app-shell/AppShell').then(m => ({ Component: m.default })),
            children: [
              { index: true, loader: ({ params }) => redirect(buildPath(ROUTES.DASHBOARD, { orgId: params.orgId! })) },
              ...appRoutes.map(toRouteObject),
            ],
          },
          ...privateRoutes.map(toRouteObject),
        ],
      },
      ...publicRoutes.map(toRouteObject),
    ],
  },
])
