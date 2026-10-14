import { createBrowserRouter, type LoaderFunctionArgs, redirect, type RouteObject } from 'react-router'

import RootLayout from '@/app/layouts/RootLayout'
import { getLastOrganizationId, setOrganizationId } from '@/shared/api'
import { isAuthenticated } from '@/shared/auth'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { getMiniappPlatform } from '@/shared/miniapp'
import { PageLoader } from '@/shared/ui/kit/PageLoader'

import GuestRoute from './guards/GuestRoute'
import MiniappRoute from './guards/MiniappRoute'
import PrivateRoute from './guards/PrivateRoute'
import RequireAbility from './guards/RequireAbility'
import RouteError from './RouteError'
import {
  type AppRoute,
  appRoutes,
  guestRoutes,
  miniappRoutes,
  previewRoutes,
  privateRoutes,
  publicRoutes,
} from './routes'

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

// Корень сайта: из мессенджера — в Mini App; в кабинете — в организацию прошлого визита или к выбору рабочей области
const homeLoader = () => {
  if (getMiniappPlatform()) return redirect(ROUTES.TODAY)
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
      { Component: MiniappRoute, children: miniappRoutes.map(toRouteObject) },
      {
        path: ROUTES.PREVIEW,
        lazy: () => import('@/pages/preview/PreviewLayout').then(m => ({ Component: m.default })),
        children: [{ index: true, loader: () => redirect(ROUTES.PREVIEW_TODAY) }, ...previewRoutes.map(toRouteObject)],
      },
      ...publicRoutes.map(toRouteObject),
    ],
  },
])
