import { Screen } from '@/shared/ui/kit/Screen';
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader';
import { StateView } from '@/shared/ui/kit/StateView';

// Заглушка до этапа 2 (шаблоны, свои программы, редактор)
const ProgramsPage = () => (
  <Screen header={<ScreenHeader title="Программы" />}>
    <StateView state="empty" empty={{ title: 'Скоро', description: 'Шаблоны и свои программы появятся на следующем этапе' }} />
  </Screen>
);

export default ProgramsPage;
