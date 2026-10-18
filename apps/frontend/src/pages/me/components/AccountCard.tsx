import { CameraIcon, CheckIcon } from 'lucide-react'

import { useRef } from 'react'

import { MESSENGER_LABEL, useLinkState } from '@/entities/link'
import { type Profile, useUploadAvatar } from '@/entities/profile'
import { useSportUser } from '@/entities/sport-user'
import { useStatsSummary } from '@/entities/stats'
import { toAssetUrl } from '@/shared/api'
import { InkPanel } from '@/shared/ui/kit/InkPanel'
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

const ROLE = { MALE: 'спортсмен', FEMALE: 'спортсменка' } as const

// Вырез-перфорация поперёк карты — тот же корешок, что у билетов комплексов
const Perforation = () => (
  <div className='relative -mx-5 my-5'>
    <div className='border-background/25 border-t-[1.5px] border-dashed' />
    <span className='bg-background absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full' />
    <span className='bg-background absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full' />
  </div>
)

const Figure = ({ label, value }: { label: string; value: number | undefined }) => (
  <div className='flex flex-col gap-1.5'>
    <Eyebrow
      as='p'
      tone='inverseMuted'
    >
      {label}
    </Eyebrow>
    <Poster
      size='xl'
      tone='inverse'
      numeric
    >
      {value ?? '—'}
    </Poster>
  </div>
)

// Фото на карте: камера поверх — сменить; при первом входе фото берётся из мессенджера
const CardPhoto = ({ profile }: { profile: Profile }) => {
  const upload = useUploadAvatar()
  const input = useRef<HTMLInputElement>(null)

  return (
    <div className='relative shrink-0'>
      <PersonAvatar
        name={profile.displayName}
        src={toAssetUrl(profile.avatarUrl)}
        tone='accent'
        className='ring-background/90 ring-offset-foreground size-[92px] text-[30px] ring-[1.5px] ring-offset-4'
      />
      <Button
        variant='paper'
        size='icon-sm'
        aria-label={profile.avatarUrl ? 'Сменить фото' : 'Загрузить фото'}
        disabled={upload.isPending}
        onClick={() => input.current?.click()}
        className='absolute -right-2 -bottom-1'
      >
        <CameraIcon />
      </Button>
      <input
        ref={input}
        type='file'
        accept='image/jpeg,image/png,image/webp'
        className='sr-only'
        onChange={event => {
          const file = event.target.files?.[0]
          if (file) upload.mutate(file)
          // Тот же файл ещё раз — тоже событие
          event.target.value = ''
        }}
      />
    </div>
  )
}

// Карта участника: кто ты в Спортботе одним взглядом — фото, имя, номер, серия и где на связи.
// Жёсткая синяя тень у чёрной плашки — та же «нажимаемость», но в масштабе вещи, а не кнопки
export const AccountCard = ({ profile }: { profile: Profile }) => {
  const me = useSportUser()
  const summary = useStatsSummary()
  const links = useLinkState()
  const linked = links.data?.linked ?? []

  return (
    <Rise className='px-gutter'>
      <InkPanel className='mr-1.5 mb-1.5 p-5 shadow-[6px_6px_0_var(--sb-blue)]'>
        <div
          aria-hidden
          className='pointer-events-none absolute -inset-5 overflow-hidden'
        >
          <div className='sb-sheen absolute inset-y-0 left-0 w-1/2 motion-reduce:hidden' />
        </div>

        <div className='flex items-baseline justify-between gap-3'>
          <Eyebrow
            as='p'
            tone='inverseMuted'
          >
            Спортбот · карта участника
          </Eyebrow>
          {me.data && (
            <Poster
              as='span'
              size='xs'
              tone='inverse'
              numeric
            >
              № {String(me.data.userId).padStart(6, '0')}
            </Poster>
          )}
        </div>

        <div className='mt-6 flex items-end gap-5'>
          <CardPhoto profile={profile} />
          <div className='min-w-0 flex-1 pb-1'>
            {profile.gender && (
              <Eyebrow
                as='p'
                tone='inverseMuted'
                className='mb-1'
              >
                {ROLE[profile.gender]}
              </Eyebrow>
            )}
            <Poster
              as='h2'
              size='3xl'
              tone='inverse'
              fit
            >
              {profile.displayName}
            </Poster>
          </div>
        </div>

        <Perforation />

        <div className='grid grid-cols-[1fr_1fr_auto] items-end gap-4'>
          <Figure
            label='серия'
            value={summary.data?.currentStreak}
          />
          <Figure
            label='рекорд'
            value={summary.data?.bestStreak}
          />
          <div className='flex flex-col items-end gap-1.5'>
            <Eyebrow
              as='p'
              tone='inverseMuted'
            >
              на связи
            </Eyebrow>
            <div className='flex gap-1.5'>
              {linked.map(m => (
                // Печать мессенджера: штамп на карте, а не бейдж — это факт, а не тег
                <Text
                  key={m}
                  as='span'
                  size='xs'
                  tone='inverse'
                  className='border-background/70 inline-flex items-center gap-1 border-[1.5px] px-1.5 py-0.5 tracking-[0.06em] uppercase'
                >
                  <CheckIcon className='size-3' />
                  {MESSENGER_LABEL[m]}
                </Text>
              ))}
            </div>
          </div>
        </div>
      </InkPanel>
    </Rise>
  )
}
