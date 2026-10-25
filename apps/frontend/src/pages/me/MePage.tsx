import { useProfile } from '@sportbot/api/entities/profile'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'

import { AccountCard } from './components/AccountCard'
import { DeveloperTicket } from './components/DeveloperTicket'
import { SectionButtons } from './components/SectionButtons'

// Профиль (frontend-tz, 13): карта участника и кнопки разделов, пункты — на экранах разделов
const MePage = () => {
  const profile = useProfile()

  return (
    <Screen
      header={<ScreenHeader title='Профиль' />}
      className='gap-10'
    >
      <QueryScreen query={profile}>
        {p => (
          <>
            <AccountCard profile={p} />
            <SectionButtons profile={p} />
            <DeveloperTicket />
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default MePage
