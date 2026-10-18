import { MESSENGER_LABEL, useLinkState } from '@/entities/link'
import { type Profile, useAvatarFromMessenger, useRemoveAvatar } from '@/entities/profile'
import { toAssetUrl } from '@/shared/api'
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Фото: сменить — камерой на карте участника, здесь — убрать или забрать из мессенджера
export const PhotoSection = ({ profile }: { profile: Profile }) => {
  const links = useLinkState()
  const remove = useRemoveAvatar()
  const fromMessenger = useAvatarFromMessenger()
  const linked = links.data?.linked ?? []

  return (
    <ScreenSection>
      <div className='flex items-center gap-4'>
        <PersonAvatar
          name={profile.displayName}
          src={toAssetUrl(profile.avatarUrl)}
          tone='accent'
          className='size-14 text-[20px]'
        />
        <div className='flex flex-wrap gap-2'>
          {profile.avatarUrl ? (
            <Button
              variant='outline'
              size='xs'
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              Убрать фото
            </Button>
          ) : (
            // Фото нет — сам убрал или в мессенджере его не нашлось при входе: предлагаем забрать оттуда
            linked.map(m => (
              <Button
                key={m}
                variant='outline'
                size='xs'
                disabled={fromMessenger.isPending}
                onClick={() => fromMessenger.mutate(m)}
              >
                Взять фото из {MESSENGER_LABEL[m]}
              </Button>
            ))
          )}
        </div>
      </div>
    </ScreenSection>
  )
}
