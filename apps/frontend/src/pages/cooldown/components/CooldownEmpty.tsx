import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Lead, Poster } from '@/shared/ui/kit/Typography'

// На отработавшие мышцы растяжек не нашлось
export const CooldownEmpty = ({ back }: { back: string }) => (
  <Screen
    header={
      <TopBar
        back={back}
        title='Заминка'
      />
    }
    className='px-gutter'
  >
    <Rise>
      <Lead>растяжек под эту тренировку —</Lead>
      <Poster
        as='h1'
        size='display'
        tone='primary'
      >
        нет
      </Poster>
      <Lead
        size='md'
        tone='soft'
        className='mt-3'
      >
        На мышцы, которые работали, подходящих растяжек нет.
      </Lead>
    </Rise>
  </Screen>
)
