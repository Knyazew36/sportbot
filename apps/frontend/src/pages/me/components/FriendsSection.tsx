import { CheckIcon, ChevronRightIcon, Share2Icon } from 'lucide-react'
import { Link } from 'react-router'

import { useCreateInvite, useFriends } from '@/entities/social'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { notifySuccess } from '@/shared/lib/notify'
import { shareLink } from '@/shared/miniapp'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
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
      variant='block'
      index={6}
      title='Друзья'
      aside={friends.data ? `${friends.data.length} в списке` : undefined}
    >
      {friends.data?.length ? (
        <List>
          {friends.data.map(f => (
            <ListRow
              key={f.id}
              lead={f.currentStreak}
              title={
                <Link
                  to={buildPath(ROUTES.FRIEND, { friendId: f.id })}
                  className='underline-offset-4 after:absolute after:inset-0 hover:underline'
                >
                  {f.displayName}
                </Link>
              }
              className='relative'
              meta={f.paused ? 'на паузе' : `серия ${f.currentStreak}`}
              trail={<ChevronRightIcon className='text-foreground/40 size-5' />}
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
            </ListRow>
          ))}
        </List>
      ) : (
        <Text tone='muted'>Друзей пока нет. Пригласи — будете видеть тренировки и серии друг друга.</Text>
      )}
      <Button
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
