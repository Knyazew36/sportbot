import type { Cooldown } from '@sportbot/api/entities/workout'

import { useCooldownFlow } from '../model/use-cooldown-flow'
import { CooldownEmpty } from './CooldownEmpty'
import { CooldownMore } from './CooldownMore'
import { CooldownOverview } from './CooldownOverview'
import { CooldownStep } from './CooldownStep'

// Заминка тренировки (frontend-tz, 9): экран по фазе — обзор, растяжка, вопрос про дополнительные
export const CooldownView = ({ cooldown, start }: { cooldown: Cooldown; start: boolean }) => {
  const flow = useCooldownFlow(cooldown, start)
  const { phase } = flow

  if (!flow.all.length) return <CooldownEmpty back={flow.back} />
  if (phase.kind === 'overview') return <CooldownOverview flow={flow} />
  if (phase.kind === 'more') return <CooldownMore flow={flow} />
  return (
    <CooldownStep
      flow={flow}
      index={phase.index}
      side={phase.side}
    />
  )
}
