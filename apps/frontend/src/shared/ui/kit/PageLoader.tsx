import { Spinner } from '@/shared/ui/shadcn/spinner'

// Полноэкранное ожидание: первая загрузка приложения и получение профиля
export const PageLoader = () => (
  <div
    className='flex min-h-svh items-center justify-center'
    aria-busy='true'
    aria-label='Загрузка'
  >
    <Spinner className='text-smoke size-6' />
  </div>
)
