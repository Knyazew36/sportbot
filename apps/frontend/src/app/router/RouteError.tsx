import { isRouteErrorResponse, useRouteError } from 'react-router'

import NotFoundPage from '@/pages/not-found/NotFoundPage'
import { StateView } from '@/shared/ui/kit/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Граница ошибок роутера: исключение в рендере страницы, в loader или сбой загрузки чанка.
// Без неё приложение показывает белый экран
const RouteError = () => {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  if (import.meta.env.DEV) console.error(error)

  return (
    <div className='mx-auto flex min-h-svh max-w-3xl items-center p-4'>
      <StateView
        state='error'
        className='w-full'
        error={{
          title: 'Что-то пошло не так',
          // Частая причина — вышла новая версия, а вкладка просит уже удалённый чанк: помогает перезагрузка
          description: 'Страница не открылась. Обновите её — если ошибка повторится, попробуйте позже.',
          action: <Button onClick={() => window.location.reload()}>Обновить страницу</Button>,
        }}
      />
    </div>
  )
}

export default RouteError
