import { View } from 'react-native';

import { PosterTabs } from '@/shared/ui/kit/PosterTabs';
import { Screen } from '@/shared/ui/kit/Screen';
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader';
import { AttendanceSection } from '@/widgets/stats/AttendanceSection';
import { CalendarSection } from '@/widgets/stats/CalendarSection';
import { MuscleLoadSection } from '@/widgets/stats/MuscleLoadSection';
import { PeriodBar } from '@/widgets/stats/PeriodBar';
import { usePeriod } from '@/widgets/stats/periods';
import { ProgressListSection } from '@/widgets/stats/ProgressListSection';
import { RecordsSection } from '@/widgets/stats/RecordsSection';

import { AddWorkoutButton } from './components/AddWorkoutButton';
import { TABS, useTab } from './model/use-tab';

const StatsPage = () => {
  const [tab, setTab] = useTab();
  const [period] = usePeriod();

  return (
    <Screen header={<ScreenHeader title="Статистика" />} className="gap-8 pb-10">
      <View className="px-gutter">
        <PosterTabs tabs={TABS} value={tab} onValueChange={setTab} />
      </View>
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
  );
};

export default StatsPage;
