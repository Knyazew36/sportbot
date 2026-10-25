import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';

import { ContactPanel } from './components/ContactPanel';
import { DeveloperHero } from './components/DeveloperHero';
import { ServicesList } from './components/ServicesList';

// Страница команды из профиля — порт pages/developer: кто сделал приложение и как заказать своё
const DeveloperPage = () => (
  <Screen header={<TopBar title="Разработчик" />} className="gap-10 pb-10">
    <DeveloperHero />
    <ServicesList />
    <ContactPanel />
  </Screen>
);

export default DeveloperPage;
