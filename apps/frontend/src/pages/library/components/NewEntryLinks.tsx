import { PlusIcon } from 'lucide-react'

import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'

// Нет нужного в справочнике — своя запись (frontend-tz, 11.4)
export const NewEntryLinks = () => (
  <div className='grid grid-cols-2 gap-2'>
    <ButtonLink
      to={`${ROUTES.LIBRARY_NEW}?kind=exercise`}
      variant='outline'
      size='sm'
      className='h-11'
    >
      <PlusIcon strokeWidth={2.5} />
      Упражнение
    </ButtonLink>
    <ButtonLink
      to={`${ROUTES.LIBRARY_NEW}?kind=stretch`}
      variant='outline'
      size='sm'
      className='h-11'
    >
      <PlusIcon strokeWidth={2.5} />
      Растяжку
    </ButtonLink>
  </div>
)
