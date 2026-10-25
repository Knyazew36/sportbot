import type { FriendProfile } from '@sportbot/api/entities/social';

import { formatDate } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/kit/Badge';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Poster } from '@/shared/ui/kit/Typography';

// Имя друга плакатом; пауза — только статусом, без причин (frontend-tz, 13.6)
export const FriendHero = ({ friend }: { friend: FriendProfile }) => (
  <Rise className="px-gutter">
    <Poster size="display" tone="primary" fit>
      {friend.displayName}
    </Poster>
    {friend.paused ? (
      <Badge variant="outline" className="mt-3">
        {`на паузе ${friend.pauseEndDate ? `до ${formatDate(friend.pauseEndDate, 'd MMMM')}` : 'до отмены'}`}
      </Badge>
    ) : null}
  </Rise>
);
