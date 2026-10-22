import { useLocation, useNavigate, useParams } from 'react-router'

import { useAddItems, useWorkout } from '@/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ExercisePicker } from '@/widgets/program-editor/ExercisePicker'

// Забытое упражнение в прошедшую тренировку из статистики. Только в неё: комплекс правят в программе.
// Подходы к нему дописывают на экране правки — туда и возвращаемся
const WorkoutEditAddPage = () => {
  const workoutId = Number(useParams().workoutId)
  const { search } = useLocation()
  const navigate = useNavigate()
  const workout = useWorkout(workoutId)
  const add = useAddItems()
  const back = `${buildPath(ROUTES.WORKOUT_EDIT, { workoutId })}${search}`

  return (
    <ExercisePicker
      presentIds={workout.data?.exercises.map(e => e.exerciseId) ?? []}
      subtitle={workout.data?.complexName ? `в «${workout.data.complexName}»` : 'в прошедшую тренировку'}
      back={back}
      adding={add.isPending}
      onAdd={exerciseIds =>
        void add.mutateAsync({ workoutId, exerciseIds, inComplex: false }).then(() => navigate(back, { replace: true }))
      }
    />
  )
}

export default WorkoutEditAddPage
