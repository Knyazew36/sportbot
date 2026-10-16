import { ArrowLeftIcon, StarIcon } from 'lucide-react'

import { ROUTES } from '@/shared/config/paths'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { InkPanel } from '@/shared/ui/kit/InkPanel'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

// Благодарность — только здесь, на экране: бот после оплаты ничего не пишет
export const ThanksPanel = ({ amount }: { amount: number }) => (
  <Rise className='px-gutter'>
    <InkPanel className='mr-1.5 mb-1.5 flex flex-col gap-5 p-5 shadow-[6px_6px_0_var(--sb-blue)]'>
      <div className='flex flex-col gap-2'>
        <Eyebrow
          as='p'
          tone='inverseMuted'
        >
          {pluralize(amount, ['звезда', 'звезды', 'звёзд'])} — команде
        </Eyebrow>
        <Poster size='xl'>
          Спасибо!{' '}
          <StarIcon className='inline size-6 fill-current align-baseline' />
        </Poster>
        <Text tone='inverseMuted'>Это правда помогает. Продолжаем делать бота лучше.</Text>
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
