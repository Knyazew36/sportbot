import { LinkIcon } from 'lucide-react'
import { useParams } from 'react-router'

import { useSharedWorkout } from '@sportbot/api/entities/workout'
import { getApiErrorStatus } from '@/shared/api'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { ScreenState } from '@/shared/ui/kit/ScreenState'

import { ResultView } from './components/ResultView'

const WorkoutResultPage = () => {
  const token = useParams().token ?? ''
  const workout = useSharedWorkout(token)

  if (getApiErrorStatus(workout.error) === 404)
    return (
      <ScreenState
        state='empty'
        icon={LinkIcon}
        title='Ссылка устарела'
        description='Этой тренировки больше нет.'
        className='mx-gutter mt-10'
      />
    )

  return <QueryScreen query={workout}>{data => <ResultView workout={data} />}</QueryScreen>
}

export default WorkoutResultPage
