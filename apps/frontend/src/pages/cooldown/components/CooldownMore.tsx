import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Lead, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import type { CooldownFlow } from '../model/use-cooldown-flow'
import { CooldownListSheet } from './CooldownSheets'

// Основной блок пройден: продолжить растяжками «если есть время» или уйти к итогу (frontend-tz, 9.1)
export const CooldownMore = ({ flow }: { flow: CooldownFlow }) => (
  <Screen
    header={
      <TopBar
        back={flow.back}
        title='Заминка'
        subtitle='основной блок пройден'
      />
    }
    footer={
      <StickyFooter>
        <Button
          variant='outline'
          size='lg'
          onClick={flow.finish}
        >
          Нет
        </Button>
        <Button
          size='lg'
          onClick={() => flow.go(flow.cooldown.main.length)}
        >
          Да
        </Button>
      </StickyFooter>
    }
    className='px-gutter'
  >
    <Rise className='flex flex-1 flex-col justify-center'>
      <Lead>есть время ещё —</Lead>
      <Poster
        as='h1'
        size='display'
        tone='primary'
        className='mt-1'
      >
        на {flow.cooldown.optionalMinutes} мин?
      </Poster>
      <div className='sb-lanes mt-6 h-20 opacity-30' />
    </Rise>
    <CooldownListSheet flow={flow} />
  </Screen>
)
