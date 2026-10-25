import { useParams } from 'react-router'

import { useCooldown } from '@sportbot/api/entities/workout'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'

import { OfferView } from './components/OfferView'

const WorkoutFinishedPage = () => {
  const workoutId = Number(useParams().workoutId)
  const cooldown = useCooldown(workoutId)
  return <QueryScreen query={cooldown}>{data => <OfferView cooldown={data} />}</QueryScreen>
}

export default WorkoutFinishedPage
