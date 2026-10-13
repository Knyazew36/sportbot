import { Outlet, ScrollRestoration, useNavigation } from 'react-router'

// Корневой layout всех маршрутов: общая обвязка, не зависящая от входа
const RootLayout = () => {
  const { state } = useNavigation()

  return (
    <>
      {/* Переход на ленивую страницу: пока грузится чанк, старая страница остаётся — полоса показывает, что клик принят */}
      {state === 'loading' && (
        <div
          role='progressbar'
          aria-label='Загрузка страницы'
          className='bg-foreground fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse'
        />
      )}
      <Outlet />
      <ScrollRestoration />
    </>
  )
}

export default RootLayout
