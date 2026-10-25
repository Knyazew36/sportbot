import { useNavigate, useParams, useSearchParams } from 'react-router'

import { pickerSubtitle, supersetTargetFromParams, useAddComplexExercises, useProgram } from '@sportbot/api/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ExercisePicker } from '@/widgets/program-editor/ExercisePicker'

// Подбор упражнений в комплекс программы пользователя (frontend-tz, 10.3)
const AddExercisePage = () => {
  const params = useParams()
  const programId = Number(params.programId)
  const complexId = Number(params.complexId)
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const target = supersetTargetFromParams(search)
  const program = useProgram(programId)
  const add = useAddComplexExercises()
  const complex = program.data?.complexes.find(c => c.id === complexId)
  const back = buildPath(ROUTES.PROGRAM_COMPLEX, { programId, complexId })

  return (
    <ExercisePicker
      presentIds={complex?.exercises.map(e => e.exerciseId) ?? []}
      subtitle={pickerSubtitle(complex, target)}
      back={back}
      target={target}
      adding={add.isPending}
      onAdd={exerciseIds =>
        add.mutate({ complexId, exerciseIds, ...target }, { onSuccess: () => navigate(back, { replace: true }) })
      }
    />
  )
}

export default AddExercisePage
