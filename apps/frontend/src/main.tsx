import { createRoot } from 'react-dom/client'

import { StrictMode } from 'react'

// Первым: общий API-клиент настраивается до любого запроса
import '@/shared/api/setup'
import { initMiniapp } from '@/shared/miniapp'

import './global.css'

const bootstrap = async () => {
  await initMiniapp()
  // Роутер создаётся на импорте App и сразу запускает лоадеры с проверкой авторизации —
  // к этому моменту данные запуска мини-приложения уже должны быть прочитаны
  const { default: App } = await import('./App.tsx')

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
