import { Navigate, useNavigation, useSearchParams } from 'react-router'

import { useEffect, useRef } from 'react'

import { useCurrentWorkout, useFinishSucceeded } from '@sportbot/api/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { PageLoader } from '@/shared/ui/kit/PageLoader'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'

import { StartWorkout } from './components/StartWorkout'
import { WorkoutView } from './components/WorkoutView'

const WorkoutPage = () => {
  const [params, setParams] = useSearchParams()
  const complexId = Number(params.get('complexId')) || undefined
  const current = useCurrentWorkout()
  const navigation = useNavigation()
  const hasWorkout = Boolean(current.data?.workout)
  const wantsStart = params.has('complexId') || params.has('start')
  // Какую тренировку показывали: после «Завершить» кеш уже пуст, а увести надо к заминке именно её
  const shownId = useRef<number | undefined>(undefined)
  if (current.data?.workout) shownId.current = current.data.workout.id
  const finished = useFinishSucceeded(shownId.current)

  // Начатая тренировка больше не нуждается в параметрах запуска: иначе после «Завершить» или отмены
  // тренировки нет, а complexId в адресе остался — StartWorkout тут же начал бы новую
  useEffect(() => {
    if (hasWorkout && wantsStart) setParams({}, { replace: true })
  }, [hasWorkout, wantsStart, setParams])

  return (
    <QueryScreen query={current}>
      {({ workout }) => {
        if (workout) return <WorkoutView workout={workout} />
        // Сервер засчитал завершение — дальше предложение заминки, а за ним итог
        if (finished && shownId.current)
          return (
            <Navigate
              to={buildPath(ROUTES.WORKOUT_FINISHED, { workoutId: shownId.current })}
              replace
            />
          )
        // Экран заминки ещё грузится (lazy-маршрут): редирект на «Сегодня» перебил бы переход
        if (navigation.state !== 'idle') return <PageLoader />
        // Без complexId и без начатой тренировки — например, её завершили в боте
        if (!params.has('complexId') && !params.has('start')) return <Navigate to={ROUTES.TODAY} replace />
        return <StartWorkout complexId={complexId} />
      }}
    </QueryScreen>
  )
}

export default WorkoutPage
