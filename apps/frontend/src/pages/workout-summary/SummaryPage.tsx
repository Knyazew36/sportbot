import { useParams } from 'react-router'

import { useWorkoutSummary } from '@sportbot/api/entities/workout'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'

import { SummaryView } from './components/SummaryView'

const SummaryPage = () => {
  const workoutId = Number(useParams().workoutId)
  const summary = useWorkoutSummary(workoutId)

  return <QueryScreen query={summary}>{data => <SummaryView summary={data} />}</QueryScreen>
}

export default SummaryPage
