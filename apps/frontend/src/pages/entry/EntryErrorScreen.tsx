import { RefreshCwIcon, SendIcon } from 'lucide-react'

import { env } from '@/env'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

export type EntryErrorReason = 'outside' | 'blocked' | 'offline'

const COPY: Record<EntryErrorReason, { lead: string; title: string; text: string }> = {
  outside: {
    lead: 'приложение живёт в мессенджере —',
    title: 'Открой из бота',
    text: 'Спортбот узнаёт тебя по аккаунту Telegram или MAX. Открой приложение кнопкой в чате с ботом.',
  },
  // Без подробностей — так требует ТЗ
  blocked: { lead: 'сюда пока нельзя —', title: 'Доступ закрыт', text: '' },
  offline: {
    lead: 'не достучались до сервера —',
    title: 'Нет связи',
    text: 'Проверь интернет. Записанные подходы не потеряются — тренировка останется открытой.',
  },
}

type EntryErrorScreenProps = { reason: EntryErrorReason; onRetry?: () => void; retrying?: boolean }

// Ошибки входа (frontend-tz, 5.3): что случилось и одно действие
export const EntryErrorScreen = ({ reason, onRetry, retrying }: EntryErrorScreenProps) => {
  const copy = COPY[reason]

  return (
    <Screen
      header={<ScreenHeader title='Спортбот' />}
      className='px-5'
    >
      <Rise className='flex flex-1 flex-col justify-center'>
        <Lead size='md'>{copy.lead}</Lead>
        <Poster
          as='h1'
          size='5xl'
          tone='primary'
          className='mt-2 text-[min(84px,19vw)]'
        >
          {copy.title}
        </Poster>
        {copy.text && (
          <Text
            size='lg'
            tone='soft'
            className='mt-5'
          >
            {copy.text}
          </Text>
        )}
        <div className='sb-lanes mt-8 h-20 opacity-30' />
        {reason === 'outside' && (
          <ButtonLink
            to={env.BOT_URL}
            size='lg'
            className='mt-8 w-full justify-between'
          >
            Перейти к боту
            <SendIcon className='size-5' />
          </ButtonLink>
        )}
        {reason === 'offline' && onRetry && (
          <Button
            size='lg'
            className='mt-8 w-full justify-between'
            onClick={onRetry}
            disabled={retrying}
          >
            Повторить
            <RefreshCwIcon className='size-5' />
          </Button>
        )}
      </Rise>
    </Screen>
  )
}
