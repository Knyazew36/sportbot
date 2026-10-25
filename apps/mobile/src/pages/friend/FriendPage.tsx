import { router, useLocalSearchParams } from 'expo-router';

import { useFriend } from '@sportbot/api/entities/social';

import { routeHref, ROUTES } from '@/shared/config/routes';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { AttendanceSection } from '@/widgets/stats/AttendanceSection';
import { CalendarSection } from '@/widgets/stats/CalendarSection';
import { MuscleLoadSection } from '@/widgets/stats/MuscleLoadSection';
import { PeriodBar } from '@/widgets/stats/PeriodBar';
import { usePeriod } from '@/widgets/stats/periods';
import { ProgressListSection } from '@/widgets/stats/ProgressListSection';
import { RecordsSection } from '@/widgets/stats/RecordsSection';
import { StatsSummarySection } from '@/widgets/stats/StatsSummarySection';

import { FriendHero } from './components/FriendHero';
import { FriendPrograms } from './components/FriendPrograms';
import { UnfriendButton } from './components/UnfriendButton';

const BACK = routeHref(ROUTES.ME_SECTION, { section: 'friends' });

// Профиль друга — порт pages/friend: его статистика строго по таблице видимости — без веса тела и ограничений,
// пауза только статусом, программы с «Себе». Что можно показывать, решает бэк по userId
const FriendPage = () => {
  const friendId = Number(useLocalSearchParams<{ friendId: string }>().friendId);
  const friend = useFriend(friendId);
  const [period] = usePeriod();

  return (
    <Screen
      header={<TopBar back={() => router.dismissTo(BACK)} title={friend.data?.displayName ?? 'Друг'} />}
      className="gap-10"
    >
      <QueryState query={friend}>
        {(f) => (
          <>
            <FriendHero friend={f} />
            <StatsSummarySection userId={f.id} />
            <FriendPrograms friend={f} />
            <PeriodBar />
            <ProgressListSection period={period} userId={f.id} />
            <RecordsSection period={period} userId={f.id} />
            <MuscleLoadSection period={period} userId={f.id} />
            <AttendanceSection period={period} userId={f.id} />
            <CalendarSection userId={f.id} />
            <UnfriendButton friend={f} onDone={() => router.dismissTo(BACK)} />
          </>
        )}
      </QueryState>
    </Screen>
  );
};

export default FriendPage;
