import { BanIcon } from 'lucide-react'

import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'

import type { CooldownFlow } from '../model/use-cooldown-flow'
import { StretchListSheet } from './StretchListSheet'

/** Весь список растяжек: переход к любой и карточка */
export const CooldownListSheet = ({ flow }: { flow: CooldownFlow }) => (
  <StretchListSheet
    open={flow.listOpen}
    onOpenChange={flow.setListOpen}
    main={flow.cooldown.main}
    optional={flow.cooldown.optional}
    minutes={flow.cooldown.minutes}
    current={flow.phase.kind === 'step' ? flow.phase.index : null}
    onPick={flow.go}
    onOpen={flow.open}
  />
)

// Карточка растяжки. Без «Подробнее в справочнике»: уход со страницы сбросил бы, на какой растяжке человек
export const CooldownDetailSheet = ({ flow }: { flow: CooldownFlow }) => {
  const { opened } = flow
  return (
    <ExerciseSheet
      exercise={opened}
      kind='stretch'
      onOpenChange={open => !open && flow.closeOpened()}
      action={
        opened &&
        flow.all.some(s => s.id === opened.id) && (
          <Button
            variant='outline'
            size='lg'
            className='w-full'
            disabled={flow.excludePending}
            onClick={() => flow.excludeStretch(opened.id)}
          >
            <BanIcon className='size-6' />
            Не предлагать
          </Button>
        )
      }
    />
  )
}
