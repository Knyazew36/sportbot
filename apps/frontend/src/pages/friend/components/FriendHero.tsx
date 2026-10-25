import { PauseIcon } from 'lucide-react'

import type { FriendProfile } from '@sportbot/api/entities/social'
import { formatDate } from '@/shared/lib/format'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Poster } from '@/shared/ui/kit/Typography'
import { Badge } from '@/shared/ui/shadcn/badge'

// Имя друга плакатом; пауза — только статусом, без причин (frontend-tz, 13.6)
export const FriendHero = ({ friend: f }: { friend: FriendProfile }) => (
  <Rise className='px-gutter'>
    <Poster
      as='h1'
      size='display'
      tone='primary'
      fit
    >
      {f.displayName}
    </Poster>
    {f.paused && (
      <Badge
        variant='outline'
        className='mt-3'
      >
        <PauseIcon />
        на паузе {f.pauseEndDate ? `до ${formatDate(f.pauseEndDate, 'd MMMM')}` : 'до отмены'}
      </Badge>
    )}
  </Rise>
)
