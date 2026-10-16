import { CheckIcon, Trash2Icon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import {
  type Program,
  useActivateProgram,
  useAddComplex,
  useDeleteProgram,
  useProgram,
  useReorderComplexes,
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
import { type ComplexListActions, ProgramComplexList } from '@/widgets/program-editor/ProgramComplexList'

import { ProgramNameForm } from './components/ProgramNameForm'

// Каждая правка сразу уходит на сервер; пока перестановка сохраняется, показываем новый порядок, а не старый
const useListActions = (programId: number) => {
  const addComplex = useAddComplex()
  const reorderComplexes = useReorderComplexes()

  const actions: ComplexListActions = {
    addComplex: name => addComplex.mutateAsync({ programId, name }),
    reorderComplexes: ids => reorderComplexes.mutate({ programId, ids }),
  }

  const arrange = (program: Program) =>
    arrangeBy(program.complexes, reorderComplexes.isPending ? reorderComplexes.variables.ids : undefined)

  return { actions, arrange, adding: addComplex.isPending }
}

// Редактор программы (frontend-tz, 10.3): название и комплексы в порядке очереди. Упражнения — на странице комплекса
const ProgramEditorPage = () => {
  const programId = Number(useParams().programId)
  const navigate = useNavigate()
  const program = useProgram(programId)
  const activate = useActivateProgram()
  const remove = useDeleteProgram()
  const { actions, arrange, adding } = useListActions(programId)

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
              variant='success'
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
            <Rise className='px-gutter flex flex-col gap-3'>
              <ProgramNameForm program={p} />
              {p.active ? (
                <Text
                  size='sm'
                  tone='positive'
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
                  variant='success'
                  className='w-full'
                  disabled={activate.isPending}
                  onClick={() => activate.mutate(p.id)}
                >
                  Сделать активной
                </Button>
              )}
            </Rise>

            <ProgramComplexList
              complexes={arrange(p)}
              actions={actions}
              adding={adding}
              complexTo={complexId => buildPath(ROUTES.PROGRAM_COMPLEX, { programId: p.id, complexId })}
            />

            <Rise className='px-gutter'>
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
