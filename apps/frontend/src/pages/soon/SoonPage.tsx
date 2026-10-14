import { WrenchIcon } from 'lucide-react'

import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { ScreenState } from '@/shared/ui/kit/ScreenState'

// Временная заглушка раздела, пока он не переведён с макета на настоящие данные
const SoonPage = () => (
  <Screen
    header={<ScreenHeader title='Спортбот' />}
    className='px-5'
  >
    <ScreenState
      state='empty'
      icon={WrenchIcon}
      title='Скоро'
      description='Раздел подключается к серверу. Пока им можно пользоваться в боте.'
    />
  </Screen>
)

export default SoonPage
