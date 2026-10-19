import { useNavigate, useParams, useSearchParams } from 'react-router'

import { type CatalogSource, SOURCE_PARAM, useTakeTemplate, useTemplates } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'

import { ProgramDetails } from './components/ProgramDetails'
import { TakeFooter } from './components/TakeFooter'

// Шаблон или программа пользователя целиком: что за тренировки внутри, прежде чем брать себе (frontend-tz, 10.2).
// Отдельного запроса нет — каталог приходит списком с составом, таб берём из ссылки
const TemplatePage = () => {
  const templateId = Number(useParams().templateId)
  const [params] = useSearchParams()
  const source: CatalogSource = params.get(SOURCE_PARAM) === 'users' ? 'users' : 'templates'
  const users = source === 'users'
  const templates = useTemplates({ source })
  const take = useTakeTemplate()
  const navigate = useNavigate()
  const template = templates.data?.find(t => t.id === templateId)

  return (
    <Screen
      header={
        <TopBar
          back={users ? `${ROUTES.PROGRAM_TEMPLATES}?${SOURCE_PARAM}=users` : ROUTES.PROGRAM_TEMPLATES}
          title={template?.name ?? (users ? 'Программа' : 'Шаблон')}
          subtitle={users ? 'программа пользователя' : 'шаблон'}
        />
      }
      footer={
        template && (
          <TakeFooter
            program={template}
            pending={take.isPending}
            onTake={() =>
              take.mutate(template.id, {
                onSuccess: copy => navigate(buildPath(ROUTES.PROGRAM, { programId: copy.id })),
              })
            }
          />
        )
      }
    >
      <QueryScreen
        query={templates}
        isEmpty={list => !list.some(t => t.id === templateId)}
        empty={{
          title: users ? 'Программа не найдена' : 'Шаблон не найден',
          description: 'Возможно, его убрали из каталога.',
          action: (
            <ButtonLink
              to={users ? `${ROUTES.PROGRAM_TEMPLATES}?${SOURCE_PARAM}=users` : ROUTES.PROGRAM_TEMPLATES}
              variant='outline'
              size='sm'
            >
              В каталог
            </ButtonLink>
          ),
        }}
      >
        {list => <ProgramDetails program={list.find(x => x.id === templateId)!} />}
      </QueryScreen>
    </Screen>
  )
}

export default TemplatePage
