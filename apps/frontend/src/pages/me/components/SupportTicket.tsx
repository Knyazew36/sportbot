import { StarIcon } from 'lucide-react'

import { ROUTES } from '@/shared/config/paths'
import { canPayStars } from '@/shared/miniapp'

import { SectionTicket } from './SectionTicket'

// Звёзды есть только в Telegram — в MAX и браузере билета нет
export const SupportTicket = () =>
  canPayStars() ? (
    <SectionTicket
      to={ROUTES.ME_SUPPORT}
      icon={StarIcon}
      title='Поддержать разработчика'
      meta='звёздами Telegram'
    />
  ) : null
