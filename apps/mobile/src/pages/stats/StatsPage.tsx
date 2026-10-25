import { Screen } from '@/shared/ui/kit/Screen';
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader';
import { StateView } from '@/shared/ui/kit/StateView';

// Заглушка до этапа 2 (упражнения, рекорды, день, тренировка)
const StatsPage = () => (
  <Screen header={<ScreenHeader title="Статистика" />}>
    <StateView state="empty" empty={{ title: 'Скоро', description: 'Статистика тренировок появится на следующем этапе' }} />
  </Screen>
);

export default StatsPage;
