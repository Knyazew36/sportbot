import { useState } from 'react'

import { PayStarsForm, type StarsPreset } from '@/features/pay-stars'
import { ROUTES } from '@/shared/config/paths'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Text } from '@/shared/ui/kit/Typography'

import { ThanksHero } from './components/ThanksHero'
import { ThanksPanel } from './components/ThanksPanel'

// Суммы — не цены, а поводы из зала: за что хочется сказать спасибо
const PRESETS: StarsPreset[] = [
  { amount: 50, caption: 'за подход' },
  { amount: 100, caption: 'за тренировку' },
  { amount: 250, caption: 'за неделю' },
  { amount: 500, caption: 'за серию' },
]

// «Спасибо» команде звёздами из профиля. После оплаты форма уступает место ответу команды
const SupportPage = () => {
  const [paid, setPaid] = useState<number | null>(null)

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.ME}
          title='Спасибо'
        />
      }
      className='gap-10'
    >
      <ThanksHero />
      {paid === null ? (
        <Rise className='px-gutter flex flex-col gap-3'>
          <PayStarsForm
            purpose='donation'
            presets={PRESETS}
            onPaid={setPaid}
          />
          <Text
            size='2xs'
            tone='muted'
          >
            Одно списание, без подписки. Ошиблись суммой — /paysupport в боте.
          </Text>
        </Rise>
      ) : (
        <ThanksPanel amount={paid} />
      )}
    </Screen>
  )
}

export default SupportPage
