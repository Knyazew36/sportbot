import { useParams, useSearchParams } from 'react-router'

import { useCooldown } from '@sportbot/api/entities/workout'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'

import { CooldownView } from './components/CooldownView'

const CooldownPage = () => {
  const workoutId = Number(useParams().workoutId)
  const [params] = useSearchParams()
  const cooldown = useCooldown(workoutId)
  return (
    <QueryScreen query={cooldown}>
      {data => (
        <CooldownView
          cooldown={data}
          start={params.has('start')}
        />
      )}
    </QueryScreen>
  )
}

export default CooldownPage
