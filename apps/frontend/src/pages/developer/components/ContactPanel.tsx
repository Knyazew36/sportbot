import { ArrowUpRightIcon, SendIcon } from 'lucide-react'

import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { InkPanel } from '@/shared/ui/kit/InkPanel'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

import { KM_TEAM_URL, TELEGRAM_HANDLE, TELEGRAM_URL } from '../developer'

// Главное действие страницы — написать напрямую; сайт команды — для тех, кто хочет сначала посмотреть работы
export const ContactPanel = () => (
  <Rise className='px-gutter'>
    <InkPanel className='mr-1.5 mb-1.5 flex flex-col gap-5 p-5 shadow-[6px_6px_0_var(--sb-blue)]'>
      <div className='flex flex-col gap-2'>
        <Eyebrow
          as='p'
          tone='inverseMuted'
        >
          Есть идея или задача?
        </Eyebrow>
        <Poster size='xl'>Напишите — обсудим</Poster>
        <Text tone='inverseMuted'>Предложим решение, сроки и бюджет.</Text>
      </div>
      <div className='flex flex-col gap-3'>
        <ButtonLink
          to={TELEGRAM_URL}
          variant='paper'
          className='w-full justify-between'
        >
          {TELEGRAM_HANDLE}
          <SendIcon className='size-5' />
        </ButtonLink>
        <ButtonLink
          to={KM_TEAM_URL}
          variant='paper'
          className='w-full justify-between'
        >
          km-team.ru
          <ArrowUpRightIcon className='size-5' />
        </ButtonLink>
      </div>
    </InkPanel>
  </Rise>
)
