import { useNavigate, useParams } from 'react-router'

import {
  complexLetter,
  type Program,
  useDeleteComplex,
  useDeleteComplexExercise,
  useProgram,
  useRenameComplex,
  useReorderComplexExercises,
  useUpdateComplexExercise,
} from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { arrangeBy } from '@/widgets/program-editor/arrange'
import { type ComplexActions, ComplexEditor } from '@/widgets/program-editor/ComplexEditor'

// Каждая правка сразу уходит на сервер; пока перестановка сохраняется, показываем новый порядок, а не старый
const useComplexActions = (onDeleted: () => void) => {
  const renameComplex = useRenameComplex()
  const deleteComplex = useDeleteComplex()
  const updateExercise = useUpdateComplexExercise()
  const deleteExercise = useDeleteComplexExercise()
  const reorderExercises = useReorderComplexExercises()

  const actions: ComplexActions = {
    renameComplex: (id, name) => renameComplex.mutateAsync({ id, name }),
    deleteComplex: id => deleteComplex.mutateAsync(id).then(onDeleted),
    updateExercise: (id, plan) => updateExercise.mutateAsync({ id, ...plan }),
    deleteExercise: id => deleteExercise.mutate(id),
    reorderExercises: (complexId, ids) => reorderExercises.mutate({ complexId, ids }),
  }

  const pick = (program: Program, complexId: number) => {
    const index = program.complexes.findIndex(c => c.id === complexId)
    const complex = program.complexes[index]
    if (!complex) return null
    const exercises = reorderExercises.isPending && reorderExercises.variables.complexId === complexId
      ? arrangeBy(complex.exercises, reorderExercises.variables.ids)
      : complex.exercises
    return { complex: { ...complex, exercises }, letter: complexLetter(index) }
  }

  return { actions, pick }
}

// Комплекс программы на отдельной странице (frontend-tz, 10.3): название и упражнения с планом.
// Отдельно от списка комплексов, чтобы редактор программы не превращался в стену полей
const ComplexPage = () => {
  const params = useParams()
  const programId = Number(params.programId)
  const complexId = Number(params.complexId)
  const navigate = useNavigate()
  const program = useProgram(programId)
  const back = buildPath(ROUTES.PROGRAM, { programId })
  const { actions, pick } = useComplexActions(() => navigate(back, { replace: true }))
  const current = program.data ? pick(program.data, complexId) : null

  return (
    <Screen
      header={
        <TopBar
          back={back}
          title={current?.complex.name ?? 'Комплекс'}
          subtitle={current ? `комплекс ${current.letter} · ${program.data?.name}` : undefined}
          action={
            <ButtonLink
              to={back}
              size='sm'
            >
              Готово
            </ButtonLink>
          }
        />
      }
    >
      <QueryScreen
        query={program}
        isEmpty={p => !pick(p, complexId)}
        empty={{ title: 'Комплекса нет', description: 'Его уже удалили. Вернись в программу.' }}
      >
        {p => {
          const found = pick(p, complexId)
          return (
            found && (
              <ComplexEditor
                complex={found.complex}
                actions={actions}
                addExerciseTo={buildPath(ROUTES.PROGRAM_ADD_EXERCISE, { programId, complexId })}
              />
            )
          )
        }}
      </QueryScreen>
    </Screen>
  )
}

export default ComplexPage
