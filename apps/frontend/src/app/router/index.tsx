import { createBrowserRouter, redirect, type RouteObject } from 'react-router'

import RootLayout from '@/app/layouts/RootLayout'
import { ROUTES } from '@/shared/config/paths'
import { PageLoader } from '@/shared/ui/kit/PageLoader'

import MiniappRoute from './guards/MiniappRoute'
import RouteError from './RouteError'
import { type AppRoute, miniappRoutes, publicRoutes } from './routes'

const toRouteObject = ({ path, Component, lazy }: AppRoute): RouteObject =>
  lazy ? { path, lazy: () => lazy().then(m => ({ Component: m.default })) } : { path, Component }

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    ErrorBoundary: RouteError,
    HydrateFallback: PageLoader,
    children: [
      // Вне мессенджера MiniappRoute сам покажет экран «откройте из бота»
      { path: ROUTES.HOME, loader: () => redirect(ROUTES.TODAY) },
      { Component: MiniappRoute, children: miniappRoutes.map(toRouteObject) },
      ...publicRoutes.map(toRouteObject),
    ],
  },
])
