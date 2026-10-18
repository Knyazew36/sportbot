import { useReducedMotion } from 'motion/react'
import { RouterProvider } from 'react-router'

import { useCallback, useState } from 'react'

import { IntroPoster } from '@/widgets/intro-splash/IntroPoster'

import ServiceProvider from './app/providers/ServiceProvider'
import { router } from './app/router'

function App() {
  // Заставка один раз на запуск; кто просил систему меньше анимаций — сразу в приложение
  const reduced = useReducedMotion()
  const [intro, setIntro] = useState(!reduced)
  const hideIntro = useCallback(() => setIntro(false), [])

  return (
    <ServiceProvider>
      <RouterProvider router={router} />
      {intro && <IntroPoster onDone={hideIntro} />}
    </ServiceProvider>
  )
}

export default App
