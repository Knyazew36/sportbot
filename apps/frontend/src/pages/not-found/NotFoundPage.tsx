import { Link } from 'react-router'

import { ROUTES } from '@/shared/config/paths'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

const NotFoundPage = () => {
  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-6 p-4 text-center'>
      <span className='mono-label text-smoke'>404</span>
      <h1 className='section-heading text-heading-sm'>Страница не найдена</h1>
      <Button
        asChild
        variant='secondary'
      >
        <Link to={ROUTES.HOME}>На главную</Link>
      </Button>
    </div>
  )
}

export default NotFoundPage
