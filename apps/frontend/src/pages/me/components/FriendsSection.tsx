import { CheckIcon, Share2Icon } from 'lucide-react'

import { useCreateInvite, useFriends } from '@/entities/social'
import { toAssetUrl } from '@/shared/api'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { notifySuccess } from '@/shared/lib/notify'
import { shareLink } from '@/shared/miniapp'
import { List, ListLinkRow } from '@/shared/ui/kit/ListRow'
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

// Друзья (frontend-tz, 13.6): список с серией и «сегодня тренировался», приглашение через «Поделиться»
export const FriendsSection = () => {
  const friends = useFriends()
  const invite = useCreateInvite()

  const share = () =>
    invite.mutate(undefined, {
      onSuccess: async link => {
        // Где штатного «Поделиться» нет, ссылка копируется — об этом стоит сказать
        if ((await shareLink(link.url, link.text)) === 'copied') notifySuccess('Ссылка скопирована')()
      },
    })

  return (
    <ScreenSection
      aside={friends.data?.length ? `${friends.data.length} в списке` : undefined}
    >
      {friends.data?.length ? (
        <List>
          {friends.data.map(f => (
            <ListLinkRow
              key={f.id}
              to={buildPath(ROUTES.FRIEND, { friendId: f.id })}
              lead={
                <PersonAvatar
                  name={f.displayName}
                  src={toAssetUrl(f.avatarUrl)}
                  size='sm'
                />
              }
              title={f.displayName}
              meta={f.paused ? 'на паузе' : `серия ${f.currentStreak}`}
            >
              {f.trainedToday && (
                <Badge
                  variant='secondary'
                  className='mt-2'
                >
                  <CheckIcon />
                  сегодня тренировался
                </Badge>
              )}
            </ListLinkRow>
          ))}
        </List>
      ) : (
        <Text tone='muted'>Друзей пока нет. Пригласи — будете видеть тренировки и серии друг друга.</Text>
      )}
      <Button
        variant='share'
        className='w-full'
        disabled={invite.isPending}
        onClick={share}
      >
        <Share2Icon />
        Пригласить друга
      </Button>
    </ScreenSection>
  )
}
