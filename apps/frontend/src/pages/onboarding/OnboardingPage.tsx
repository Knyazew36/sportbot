import { useOnboarding } from '@sportbot/api/entities/onboarding'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'

import { Wizard } from './components/Wizard'

// Первый запуск (business-tz, 13): часовой пояс тут не спрашивается — Москва
const OnboardingPage = () => {
  const onboarding = useOnboarding()

  return (
    <QueryScreen
      query={onboarding}
      rows={3}
    >
      {state => <Wizard state={state} />}
    </QueryScreen>
  )
}

export default OnboardingPage
