import { useState } from 'react'

import { PayStarsForm } from '@/features/pay-stars'
import { ROUTES } from '@/shared/config/paths'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'

import { SupportHero } from './components/SupportHero'
import { ThanksPanel } from './components/ThanksPanel'

// Поддержка разработчика звёздами из профиля. После оплаты форма уступает место благодарности
const SupportPage = () => {
  const [paid, setPaid] = useState<number | null>(null)

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.ME}
          title='Поддержать'
        />
      }
      className='gap-10'
    >
      <SupportHero />
      {paid === null ? (
        <Rise className='px-gutter'>
          <PayStarsForm
            purpose='donation'
            onPaid={setPaid}
          />
        </Rise>
      ) : (
        <ThanksPanel amount={paid} />
      )}
    </Screen>
  )
}

export default SupportPage
