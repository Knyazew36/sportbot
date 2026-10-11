import { Link } from 'react-router'
import { ROUTES } from '@/shared/config/paths'

const NotFoundPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">Страница не найдена</h1>
      <Link to={ROUTES.HOME} className="text-blue-600 underline">
        На главную
      </Link>
    </div>
  )
}

export default NotFoundPage
