import { ArrowRightIcon } from 'lucide-react'

import { useCooldown } from '@sportbot/api/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { InkPanel } from '@/shared/ui/kit/InkPanel'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { pluralize } from '@front-cmdt/utils/pluralize'

// Заминка — следующий шаг после финиша, поэтому предлагаем её главной плашкой, а не ссылкой в протоколе.
// Набор с сервера тот же, что откроется в заминке; растяжек под эти мышцы нет — нечего и предлагать
export const CooldownOffer = ({ workoutId, className }: { workoutId: number; className?: string }) => {
  const cooldown = useCooldown(workoutId)
  const c = cooldown.data
  if (!c || c.main.length + c.optional.length === 0) return null

  return (
    <InkPanel className={cn('mr-1.5 mb-1.5 flex flex-col gap-4 p-5 shadow-[6px_6px_0_var(--sb-blue)]', className)}>
      <div className='flex flex-col gap-2'>
        <Eyebrow
          as='p'
          tone='inverseMuted'
        >
          Следующий шаг
        </Eyebrow>
        <Poster
          size='xl'
          numeric
        >
          Заминка ~{c.minutes} мин
        </Poster>
        <Text tone='inverseMuted'>
          {pluralize(c.main.length, ['растяжка', 'растяжки', 'растяжек'])} на мышцы, которые работали. Таймер
          запускаешь сам.
        </Text>
      </div>
      <ButtonLink
        to={buildPath(ROUTES.COOLDOWN, { workoutId })}
        variant='paper'
        size='lg'
        className='w-full justify-between'
      >
        Начать заминку
        <ArrowRightIcon
          className='size-6'
          strokeWidth={2.5}
        />
      </ButtonLink>
    </InkPanel>
  )
}
