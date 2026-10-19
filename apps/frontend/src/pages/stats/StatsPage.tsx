import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { AttendanceSection } from '@/widgets/stats/AttendanceSection'
import { BodyWeightSection } from '@/widgets/stats/BodyWeightSection'
import { CalendarSection } from '@/widgets/stats/CalendarSection'
import { MuscleLoadSection } from '@/widgets/stats/MuscleLoadSection'
import { PeriodBar } from '@/widgets/stats/PeriodBar'
import { usePeriod } from '@/widgets/stats/periods'
import { ProgressListSection } from '@/widgets/stats/ProgressListSection'
import { RecordsSection } from '@/widgets/stats/RecordsSection'
import { StatsSummarySection } from '@/widgets/stats/StatsSummarySection'

// Статистика (frontend-tz, 12): серия от периода не зависит и стоит над переключателем, всё ниже него — за период.
// Цифры считает бэк — те же, что в боте
const StatsPage = () => {
  const [period] = usePeriod()

  return (
    <Screen
      header={<ScreenHeader title='Статистика' />}
      className='gap-10 pb-10'
    >
      <StatsSummarySection />
      <PeriodBar />
      <AttendanceSection period={period} />
      <ProgressListSection period={period} />
      <RecordsSection period={period} />
      <MuscleLoadSection period={period} />
      <BodyWeightSection period={period} />
      <CalendarSection />
    </Screen>
  )
}

export default StatsPage
