import { Link } from 'react-router'

import { useFriends } from '@sportbot/api/entities/social'
import { toAssetUrl } from '@/shared/api'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'

const AVATARS = 4

// Друзья, которые сегодня тоже потренировались. Никого — блока нет: «никто не тренировался» не мотивирует
export const FriendsToday = () => {
  const friends = useFriends()
  const trained = friends.data?.filter(f => f.trainedToday) ?? []
  const [first] = trained
  if (!first) return null

  const text = trained.length > 1 ? `${first.displayName} и ещё ${trained.length - 1}` : first.displayName

  return (
    <Rise className='px-gutter'>
      <Link
        to={buildPath(ROUTES.ME_SECTION, { section: 'friends' })}
        className='border-border flex items-center gap-3 border-[1.5px] p-3'
      >
        <div className='flex shrink-0 -space-x-2'>
          {trained.slice(0, AVATARS).map(f => (
            <PersonAvatar
              key={f.id}
              name={f.displayName}
              src={toAssetUrl(f.avatarUrl)}
              size='sm'
              className='ring-background ring-2'
            />
          ))}
        </div>
        <div className='min-w-0'>
          <Eyebrow as='p'>Друзья сегодня</Eyebrow>
          <Text className='mt-1 truncate'>{text} — тоже потренировались</Text>
        </div>
      </Link>
    </Rise>
  )
}
