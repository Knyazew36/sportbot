import { Screen } from '@/shared/ui/kit/Screen';
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader';
import { StateView } from '@/shared/ui/kit/StateView';

// Заглушка до этапа 2 (справочник упражнений и растяжек)
const LibraryPage = () => (
  <Screen header={<ScreenHeader title="Библиотека" />}>
    <StateView state="empty" empty={{ title: 'Скоро', description: 'Справочник упражнений появится на следующем этапе' }} />
  </Screen>
);

export default LibraryPage;
