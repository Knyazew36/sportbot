import { BellOffIcon } from 'lucide-react'

import { useAllowWriteAccess } from '@sportbot/api/entities/sport-user'
import { env } from '@/env'
import { canRequestWriteAccess, requestWriteAccess } from '@/shared/miniapp'
import { Text } from '@/shared/ui/kit/Typography'

// Мессенджер не разрешает боту писать (frontend-tz, 5.2): по нажатию — штатный запрос,
// где его нет — подсказка написать боту /start
export const PermissionBanner = () => {
  const allow = useAllowWriteAccess()
  const native = canRequestWriteAccess()

  const onClick = async () => {
    if (await requestWriteAccess()) allow.mutate()
  }

  const content = (
    <>
      <BellOffIcon
        className='text-primary size-4 shrink-0'
        aria-hidden
      />
      <Text
        as='span'
        size='xs'
        tone='soft'
        className='flex-1'
      >
        Бот не сможет задавать вопросы и напоминать —{' '}
        <span className='text-primary underline underline-offset-2'>{native ? 'разрешить' : 'напиши боту /start'}</span>
      </Text>
    </>
  )

  const className =
    'border-border hover:bg-accent flex w-full items-center gap-3 border-b-[1.5px] px-gutter py-3 text-left transition-colors'

  return native ? (
    <button
      type='button'
      className={className}
      onClick={() => void onClick()}
      disabled={allow.isPending}
    >
      {content}
    </button>
  ) : (
    <a
      href={env.BOT_URL}
      target='_blank'
      rel='noopener noreferrer'
      className={className}
    >
      {content}
    </a>
  )
}
