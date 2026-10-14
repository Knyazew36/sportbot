import { Trash2Icon } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router'

import { useState } from 'react'

import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { ComplexList } from '@/widgets/program-editor/ComplexList'

import { programs } from './model/mock'
import { setDraft, useProgramDraft } from './model/program-drafts'

// Редактор программы (frontend-tz, 10.3). «new» — пустая программа «с нуля»
const ProgramEditorScreen = () => {
  const { programId = 'new' } = useParams()
  const [search] = useSearchParams()
  const source = programs.find(p => String(p.id) === programId)
  const [title, setTitle] = useState(source?.title ?? '')
  const complexes = useProgramDraft(programId)

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.PREVIEW_PROGRAMS}
          title={title || 'Новая программа'}
          subtitle={`${complexes.length} комплекса по очереди`}
          action={
            <ButtonLink
              to={ROUTES.PREVIEW_PROGRAMS}
              size='sm'
            >
              Готово
            </ButtonLink>
          }
        />
      }
    >
      <Rise className='flex flex-col gap-2 px-gutter'>
        <Label htmlFor='program-title'>Название программы</Label>
        <Input
          id='program-title'
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder='Например, «Сила. Сплит на 3 дня»'
        />
      </Rise>

      {/* После подбора упражнений возвращаемся с раскрытым комплексом, куда добавляли */}
      <ComplexList
        complexes={complexes}
        onChange={update => setDraft(programId, update)}
        nextId={source?.nextComplexId ?? complexes[0]?.id}
        initialExpandedId={Number(search.get('open')) || null}
        addExerciseTo={complexId => buildPath(ROUTES.PREVIEW_PROGRAM_ADD_EXERCISE, { programId, complexId })}
      />

      {source && (
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
            onConfirm={() => undefined}
          >
            <Trash2Icon />
            Удалить программу
          </ConfirmAction>
        </Rise>
      )}
    </Screen>
  )
}

export default ProgramEditorScreen
