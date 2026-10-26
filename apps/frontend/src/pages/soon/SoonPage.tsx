import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { ScreenState } from '@/shared/ui/kit/ScreenState'

// Временная заглушка раздела, пока он не переведён с макета на настоящие данные
const SoonPage = () => (
  <Screen
    header={<ScreenHeader title='Спортбот' />}
    className='px-gutter'
  >
    <ScreenState
      state='empty'
      title='Скоро'
      description='Раздел подключается к серверу. Пока им можно пользоваться в боте.'
      action={
        <ButtonLink
          to={ROUTES.TODAY}
          variant='outline'
        >
          На «Сегодня»
        </ButtonLink>
      }
    />
  </Screen>
)

export default SoonPage
