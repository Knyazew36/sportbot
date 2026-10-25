import { useOnboarding } from '@sportbot/api/entities/onboarding';
import { QueryState } from '@/shared/ui/kit/QueryState';

import { Wizard } from './components/Wizard';

// Первый запуск — порт pages/onboarding. Часовой пояс тут не спрашивается — Москва
const OnboardingPage = () => {
  const onboarding = useOnboarding();

  return <QueryState query={onboarding}>{(state) => <Wizard state={state} />}</QueryState>;
};

export default OnboardingPage;
