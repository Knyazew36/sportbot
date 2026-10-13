import { useParams, useSearchParams } from 'react-router'

import { useState } from 'react'

import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { ComplexList } from '@/widgets/program-editor/ComplexList'

import { templates } from '../model/mock'
import { setDraft, templateDraftId, useProgramDraft } from '../model/program-drafts'

const backToTemplates = `${ROUTES.PREVIEW_ADMIN}?tab=templates`

// Редактор шаблона: тот же, что у программ пользователя, плюс описание шаблона (frontend-tz, 14.2)
const TemplateEditorScreen = () => {
  const { templateId = 'new' } = useParams()
  const [search] = useSearchParams()
  const source = templates.find(t => String(t.id) === templateId)
  const draftId = templateDraftId(templateId)
  const complexes = useProgramDraft(draftId)
  const [title, setTitle] = useState(source?.title ?? '')

  return (
    <Screen
      header={
        <TopBar
          back={backToTemplates}
          title={title || 'Новый шаблон'}
          subtitle={`шаблон · ${complexes.length} комплекса`}
          action={
            <ButtonLink
              to={backToTemplates}
              size='sm'
            >
              Готово
            </ButtonLink>
          }
        />
      }
    >
      <Rise className='flex flex-col gap-4 px-5'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='template-title'>Название шаблона</Label>
          <Input
            id='template-title'
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder='Например, «Новичок. Фулбади»'
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='template-description'>Описание</Label>
          <Textarea
            id='template-description'
            defaultValue={source?.description ?? ''}
            placeholder='Кому подходит и как устроена неделя'
          />
        </div>
      </Rise>

      <ComplexList
        complexes={complexes}
        onChange={update => setDraft(draftId, update)}
        initialExpandedId={Number(search.get('open')) || null}
        addExerciseTo={complexId => buildPath(ROUTES.PREVIEW_PROGRAM_ADD_EXERCISE, { programId: draftId, complexId })}
      />
    </Screen>
  )
}

export default TemplateEditorScreen
