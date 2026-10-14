import { CheckIcon, Trash2Icon } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import {
  type Program,
  useActivateProgram,
  useAddComplex,
  useDeleteComplex,
  useDeleteComplexExercise,
  useDeleteProgram,
  useProgram,
  useRenameComplex,
  useReorderComplexes,
  useReorderComplexExercises,
  useUpdateComplexExercise,
} from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { arrangeBy } from '@/widgets/program-editor/arrange'
import { type ComplexEditorActions, ProgramComplexList } from '@/widgets/program-editor/ProgramComplexList'

import { ProgramNameForm } from './components/ProgramNameForm'

// Каждая правка сразу уходит на сервер; пока перестановка сохраняется, показываем новый порядок, а не старый
const useEditorActions = (programId: number) => {
  const addComplex = useAddComplex()
  const renameComplex = useRenameComplex()
  const deleteComplex = useDeleteComplex()
  const reorderComplexes = useReorderComplexes()
  const updateExercise = useUpdateComplexExercise()
  const deleteExercise = useDeleteComplexExercise()
  const reorderExercises = useReorderComplexExercises()

  const actions: ComplexEditorActions = {
    addComplex: name => addComplex.mutateAsync({ programId, name }),
    reorderComplexes: ids => reorderComplexes.mutate({ programId, ids }),
    renameComplex: (id, name) => renameComplex.mutateAsync({ id, name }),
    deleteComplex: id => deleteComplex.mutateAsync(id),
    updateExercise: (id, plan) => updateExercise.mutateAsync({ id, ...plan }),
    deleteExercise: id => deleteExercise.mutate(id),
    reorderExercises: (complexId, ids) => reorderExercises.mutate({ complexId, ids }),
  }

  const arrange = (program: Program) =>
    arrangeBy(program.complexes, reorderComplexes.isPending ? reorderComplexes.variables.ids : undefined).map(c =>
      reorderExercises.isPending && reorderExercises.variables.complexId === c.id
        ? { ...c, exercises: arrangeBy(c.exercises, reorderExercises.variables.ids) }
        : c,
    )

  return { actions, arrange, adding: addComplex.isPending }
}

// Редактор программы (frontend-tz, 10.3): название, комплексы в порядке очереди, упражнения с планом
const ProgramEditorPage = () => {
  const programId = Number(useParams().programId)
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const program = useProgram(programId)
  const activate = useActivateProgram()
  const remove = useDeleteProgram()
  const { actions, arrange, adding } = useEditorActions(programId)

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.PROGRAMS}
          title={program.data?.name ?? 'Программа'}
          subtitle={
            program.data
              ? `${pluralize(program.data.complexes.length, ['комплекс', 'комплекса', 'комплексов'])} по очереди`
              : undefined
          }
          action={
            <ButtonLink
              to={ROUTES.PROGRAMS}
              size='sm'
            >
              Готово
            </ButtonLink>
          }
        />
      }
    >
      <QueryScreen query={program}>
        {p => (
          <>
            <Rise className='flex flex-col gap-3 px-5'>
              <ProgramNameForm program={p} />
              {p.active ? (
                <Text
                  size='sm'
                  tone='primary'
                  className='flex items-center gap-1.5'
                >
                  <CheckIcon
                    className='size-4'
                    strokeWidth={3}
                  />
                  Активная программа — по ней идёт очередь
                </Text>
              ) : (
                <Button
                  variant='outline'
                  className='w-full'
                  disabled={activate.isPending}
                  onClick={() => activate.mutate(p.id)}
                >
                  Сделать активной
                </Button>
              )}
            </Rise>

            {/* После подбора упражнений возвращаемся с раскрытым комплексом, куда добавляли */}
            <ProgramComplexList
              complexes={arrange(p)}
              actions={actions}
              adding={adding}
              initialExpandedId={Number(search.get('open')) || null}
              addExerciseTo={complexId => buildPath(ROUTES.PROGRAM_ADD_EXERCISE, { programId: p.id, complexId })}
            />

            <Rise className='px-5'>
              <ConfirmAction
                trigger={
                  <Button
                    variant='destructive'
                    className='w-full'
                  />
                }
                title='Удалить программу?'
                description='Программа и её комплексы пропадут. История тренировок сохранится.'
                confirmLabel='Удалить'
                onConfirm={() => remove.mutateAsync(p.id).then(() => navigate(ROUTES.PROGRAMS, { replace: true }))}
              >
                <Trash2Icon />
                Удалить программу
              </ConfirmAction>
            </Rise>
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default ProgramEditorPage
