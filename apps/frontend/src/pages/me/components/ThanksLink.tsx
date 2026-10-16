import { StarIcon } from 'lucide-react'

import { ROUTES } from '@/shared/config/paths'
import { canPayStars } from '@/shared/miniapp'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Text } from '@/shared/ui/kit/Typography'

// Тихое «спасибо» под билетом команды: по ширине текста и в золоте, чтобы не спорить с разделами.
// Звёзды есть только в Telegram — в MAX и браузере ссылки нет
export const ThanksLink = () =>
  canPayStars() ? (
    <div className='flex flex-col items-start gap-1.5'>
      <ButtonLink
        to={ROUTES.ME_SUPPORT}
        variant='gold'
        size='sm'
      >
        <StarIcon
          className='size-4 fill-current'
          strokeWidth={2.5}
        />
        Сказать спасибо звёздой
      </ButtonLink>
      <Text
        size='2xs'
        tone='muted'
      >
        по желанию · приложение бесплатное
      </Text>
    </div>
  ) : null
