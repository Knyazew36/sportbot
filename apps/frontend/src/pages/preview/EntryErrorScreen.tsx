import { RefreshCwIcon, SendIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import type { ReactNode } from 'react'

import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type Reason = 'outside' | 'blocked' | 'offline'

const REASONS: { value: Reason; label: string }[] = [
  { value: 'outside', label: 'Не из бота' },
  { value: 'blocked', label: 'Блокировка' },
  { value: 'offline', label: 'Нет связи' },
]

// Ошибки входа (frontend-tz, 5.3): три ситуации, у каждой — что случилось и одно действие
const COPY: Record<Reason, { lead: string; title: string; text: string; action: ReactNode }> = {
  outside: {
    lead: 'приложение живёт в мессенджере —',
    title: 'Открой из бота',
    text: 'Спортбот узнаёт тебя по аккаунту Telegram или MAX. Открой приложение кнопкой в чате с ботом.',
    action: (
      <ButtonLink
        to='https://t.me/sportbot'
        size='lg'
        className='w-full justify-between'
      >
        Перейти к боту
        <SendIcon className='size-5' />
      </ButtonLink>
    ),
  },
  blocked: {
    lead: 'сюда пока нельзя —',
    title: 'Доступ закрыт',
    // Без подробностей — так требует ТЗ
    text: '',
    action: null,
  },
  offline: {
    lead: 'не достучались до сервера —',
    title: 'Нет связи',
    text: 'Проверь интернет. Записанные подходы не потеряются — тренировка останется открытой.',
    action: (
      <Button
        size='lg'
        className='w-full justify-between'
      >
        Повторить
        <RefreshCwIcon className='size-5' />
      </Button>
    ),
  },
}

const EntryErrorScreen = () => {
  const { reason = 'outside' } = useParams()
  const navigate = useNavigate()
  const key = (REASONS.some(r => r.value === reason) ? reason : 'outside') as Reason
  const copy = COPY[key]

  return (
    <Screen
      key={key}
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
        {copy.action && <div className='mt-8'>{copy.action}</div>}
      </Rise>
      {/* Переключатель только для превью */}
      <Rise className='no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5'>
        <Eyebrow className='shrink-0'>превью:</Eyebrow>
        <Segmented
          options={REASONS}
          value={key}
          onValueChange={next => navigate(buildPath(ROUTES.PREVIEW_ENTRY, { reason: next }), { replace: true })}
        />
      </Rise>
    </Screen>
  )
}

export default EntryErrorScreen
