import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'

import {
  type Program,
  programKeys,
  useDeleteComplex,
  useDeleteComplexExercise,
  useProgram,
  useRenameComplex,
  useReorderComplexExercises,
  useUngroupComplexExercise,
  useUngroupSuperset,
  useUpdateComplexExercise,
} from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ComplexEditor } from '@/widgets/program-editor/ComplexEditor'
import { useComplexEditing } from '@/widgets/program-editor/use-complex-editing'

// Правки уходят на сервер по очереди; удаление упражнения и разборку суперсета можно отменить 3 секунды
const useComplexActions = (programId: number, complexId: number, onDeleted: () => void) => {
  const queryClient = useQueryClient()
  const renameComplex = useRenameComplex()
  const deleteComplex = useDeleteComplex()
  const updateExercise = useUpdateComplexExercise()
  const deleteExercise = useDeleteComplexExercise()
  const reorderExercises = useReorderComplexExercises()
  const ungroupExercise = useUngroupComplexExercise()
  const ungroupSuperset = useUngroupSuperset()

  return useComplexEditing({
    mutations: {
      renameComplex: (id, name) => renameComplex.mutateAsync({ id, name }),
      deleteComplex: id => deleteComplex.mutateAsync(id),
      updateExercise: (id, plan) => updateExercise.mutateAsync({ id, ...plan }),
      deleteExercise: id => deleteExercise.mutateAsync(id),
      reorderExercises: (id, ids) => reorderExercises.mutateAsync({ complexId: id, ids }),
      ungroupExercise: id => ungroupExercise.mutateAsync(id),
      ungroupSuperset: (id, superset) => ungroupSuperset.mutateAsync({ complexId: id, superset }),
    },
    readComplex: () =>
      queryClient.getQueryData<Program>(programKeys.detail(programId))?.complexes.find(c => c.id === complexId),
    onDeleted,
  })
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
  const { view, actions } = useComplexActions(programId, complexId, () => navigate(back, { replace: true }))
  const pick = (p: Program) => {
    const complex = p.complexes.find(c => c.id === complexId)
    return complex && view(complex)
  }

  return (
    <Screen
      header={
        <TopBar
          back={back}
          title={program.data?.complexes.find(c => c.id === complexId)?.name ?? 'Тренировка'}
          action={
            // Правки уже ушли на сервер по ходу; кнопка подтверждает и возвращает в программу
            <ButtonLink
              to={back}
              size='sm'
              variant='success'
            >
              Сохранить
            </ButtonLink>
          }
        />
      }
    >
      <QueryScreen
        query={program}
        isEmpty={p => !pick(p)}
        empty={{ title: 'Тренировки нет', description: 'Её уже удалили. Вернись в программу.' }}
      >
        {p => {
          const complex = pick(p)
          return (
            complex && (
              <ComplexEditor
                complex={complex}
                actions={actions(complex)}
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
