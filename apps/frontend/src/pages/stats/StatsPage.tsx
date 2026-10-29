import { PosterTabs } from '@/shared/ui/kit/PosterTabs'
import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { AttendanceSection } from '@/widgets/stats/AttendanceSection'
import { CalendarSection } from '@/widgets/stats/CalendarSection'
import { MuscleLoadSection } from '@/widgets/stats/MuscleLoadSection'
import { PeriodBar } from '@/widgets/stats/PeriodBar'
import { usePeriod } from '@/widgets/stats/periods'
import { ProgressListSection } from '@/widgets/stats/ProgressListSection'
import { RecordsSection } from '@/widgets/stats/RecordsSection'

import { AddWorkoutButton } from './components/AddWorkoutButton'
import { TABS, useTab } from './model/use-tab'

// Статистика (frontend-tz, 12): три вопроса, каждый на своей вкладке — «я расту?», «всё ли тело работает?»,
// «хожу ли регулярно?». С главной в посещения ведёт ссылка в шапке. Вес тела — в профиле. Цифры считает бэк — те же, что в боте
const StatsPage = () => {
  const [tab, setTab] = useTab()
  const [period] = usePeriod()

  return (
    <Screen
      header={<ScreenHeader title='Статистика' />}
      className='gap-8 pb-10'
    >
      <div className='px-gutter flex flex-col gap-4'>
        <PosterTabs
          tabs={TABS}
          value={tab}
          onValueChange={setTab}
        />
      </div>
      <PeriodBar />
      {tab === 'progress' && (
        <>
          <ProgressListSection period={period} />
          <RecordsSection period={period} />
        </>
      )}
      {tab === 'muscles' && <MuscleLoadSection period={period} />}
      {tab === 'attendance' && (
        <>
          <AttendanceSection period={period} />
          <CalendarSection />
          <AddWorkoutButton />
        </>
      )}
    </Screen>
  )
}

export default StatsPage
