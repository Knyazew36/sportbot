import { ArrowLeftIcon, StarIcon } from 'lucide-react'

import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { InkPanel } from '@/shared/ui/kit/InkPanel'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

// Ответ команды на «спасибо» — только здесь, на экране: бот после оплаты ничего не пишет
export const ThanksPanel = ({ amount }: { amount: number }) => (
  <Rise className='px-gutter'>
    <InkPanel className='mr-1.5 mb-1.5 flex flex-col gap-5 p-5 shadow-[6px_6px_0_var(--sb-gold)]'>
      <div className='flex flex-col gap-2'>
        <Eyebrow
          as='p'
          tone='inverseMuted'
          className='flex items-center gap-1.5'
        >
          Получили {amount}
          <StarIcon className='text-sb-gold size-3.5 fill-current' />
        </Eyebrow>
        <Poster size='xl'>Это греет</Poster>
        <Text tone='inverseMuted'>Спасибо, что ты с нами. Увидимся на тренировке.</Text>
      </div>
      <ButtonLink
        to={ROUTES.ME}
        variant='paper'
        className='w-full justify-between'
      >
        В профиль
        <ArrowLeftIcon className='size-5' />
      </ButtonLink>
    </InkPanel>
  </Rise>
)
