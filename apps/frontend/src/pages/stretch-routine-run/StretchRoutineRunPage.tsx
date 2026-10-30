import { useParams } from 'react-router'

import { useStretchRoutine } from '@sportbot/api/entities/stretch-routine'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'

import { RunStep } from './components/RunStep'

const StretchRoutineRunPage = () => {
  const routine = useStretchRoutine(Number(useParams().routineId))
  return <QueryScreen query={routine}>{data => <RunStep routine={data} />}</QueryScreen>
}

export default StretchRoutineRunPage
