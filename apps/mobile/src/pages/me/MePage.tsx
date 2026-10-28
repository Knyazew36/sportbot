import { useProfile } from '@/shared/local/entities/profile';

import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen } from '@/shared/ui/kit/Screen';
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader';

import { SessionExpiredBanner } from '@/widgets/session-expired/SessionExpiredBanner';

import { AccountCard } from './components/AccountCard';
import { DeveloperTicket } from './components/DeveloperTicket';
import { SectionButtons } from './components/SectionButtons';

// Профиль — порт pages/me: карта участника и кнопки разделов, пункты — на экранах разделов
const MePage = () => {
  const profile = useProfile();

  return (
    <Screen header={<ScreenHeader title="Профиль" />} className="gap-10">
      <SessionExpiredBanner />
      <QueryState query={profile}>
        {(p) => (
          <>
            <AccountCard profile={p} />
            <SectionButtons profile={p} />
            <DeveloperTicket />
          </>
        )}
      </QueryState>
    </Screen>
  );
};

export default MePage;
