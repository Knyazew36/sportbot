import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { AttendanceSection } from '@/widgets/stats/AttendanceSection'
import { BodyWeightSection } from '@/widgets/stats/BodyWeightSection'
import { CalendarSection } from '@/widgets/stats/CalendarSection'
import { MuscleLoadSection } from '@/widgets/stats/MuscleLoadSection'
import { ProgressSection } from '@/widgets/stats/ProgressSection'
import { StatsSummarySection } from '@/widgets/stats/StatsSummarySection'

// Статистика (frontend-tz, 12): сводка, графики и календарь. Цифры считает бэк — те же, что в воскресной сводке бота
const StatsPage = () => (
  <Screen
    header={<ScreenHeader title='Статистика' />}
    className='gap-10 pb-10'
  >
    <StatsSummarySection />
    <ProgressSection />
    <AttendanceSection />
    <BodyWeightSection />
    <MuscleLoadSection />
    <CalendarSection />
  </Screen>
)

export default StatsPage
