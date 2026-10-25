import { useNavigate, useParams } from 'react-router'

import { useFriend } from '@sportbot/api/entities/social'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { AttendanceSection } from '@/widgets/stats/AttendanceSection'
import { CalendarSection } from '@/widgets/stats/CalendarSection'
import { MuscleLoadSection } from '@/widgets/stats/MuscleLoadSection'
import { PeriodBar } from '@/widgets/stats/PeriodBar'
import { usePeriod } from '@/widgets/stats/periods'
import { ProgressListSection } from '@/widgets/stats/ProgressListSection'
import { RecordsSection } from '@/widgets/stats/RecordsSection'
import { StatsSummarySection } from '@/widgets/stats/StatsSummarySection'

import { FriendHero } from './components/FriendHero'
import { FriendPrograms } from './components/FriendPrograms'
import { UnfriendButton } from './components/UnfriendButton'

const BACK = buildPath(ROUTES.ME_SECTION, { section: 'friends' })

// Профиль друга (frontend-tz, 13.6): его статистика строго по таблице видимости — без веса тела и ограничений,
// пауза только статусом, программы с «Скопировать себе». Что можно показывать, решает бэк по userId
const FriendPage = () => {
  const friendId = Number(useParams().friendId)
  const navigate = useNavigate()
  const friend = useFriend(friendId)
  const [period] = usePeriod()

  return (
    <Screen
      header={
        <TopBar
          back={BACK}
          title={friend.data?.displayName ?? 'Друг'}
        />
      }
      className='gap-10'
    >
      <QueryScreen query={friend}>
        {f => (
          <>
            <FriendHero friend={f} />
            <StatsSummarySection userId={f.id} />
            <FriendPrograms friend={f} />
            <PeriodBar />
            <ProgressListSection
              period={period}
              userId={f.id}
            />
            <RecordsSection
              period={period}
              userId={f.id}
            />
            <MuscleLoadSection
              period={period}
              userId={f.id}
            />
            <AttendanceSection
              period={period}
              userId={f.id}
            />
            <CalendarSection userId={f.id} />
            <UnfriendButton
              friend={f}
              onDone={() => navigate(BACK, { replace: true })}
            />
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default FriendPage
