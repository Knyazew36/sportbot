import { ChevronRightIcon, StarIcon } from 'lucide-react'

import { ROUTES } from '@/shared/config/paths'
import { canPayStars } from '@/shared/miniapp'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'

// «Спасибо» под билетом команды: во всю ширину, как билеты, но ниже и в золоте — заметно, но не громче разделов.
// Звёзды есть только в Telegram — в MAX и браузере кнопки нет
export const ThanksLink = () =>
  canPayStars() ? (
    <ButtonLink
      to={ROUTES.ME_SUPPORT}
      variant='gold'
      className='w-full justify-start gap-3'
    >
      <StarIcon
        className='size-5 fill-current'
        strokeWidth={2.5}
      />
      Сказать спасибо
      <ChevronRightIcon className='ml-auto size-5 opacity-60' />
    </ButtonLink>
  ) : null
