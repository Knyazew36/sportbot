import { EyeIcon, PlusIcon } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useTakeTemplate, useTemplates } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

// Шаблоны программ: посмотреть состав или сразу «Взять» — копия в программах пользователя (frontend-tz, 10.2)
const TemplatesPage = () => {
  const templates = useTemplates()
  const take = useTakeTemplate()
  const navigate = useNavigate()

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.PROGRAMS}
          title='Шаблоны'
          subtitle={templates.data ? pluralize(templates.data.length, ['шаблон', 'шаблона', 'шаблонов']) : undefined}
        />
      }
      className='gap-4 px-gutter'
    >
      <QueryScreen
        query={templates}
        className=''
        isEmpty={list => list.length === 0}
        empty={{ title: 'Шаблонов пока нет', description: 'Собери программу с нуля.' }}
      >
        {list => (
          <>
            <Rise>
              <Lead>возьми и поправь под себя</Lead>
            </Rise>
            {list.map((t, i) => {
              const exercises = t.complexes.reduce((sum, c) => sum + c.exercises.length, 0)
              return (
                <Rise
                  key={t.id}
                  className='border-foreground/80 flex flex-col gap-3 border-[1.5px] p-4'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <Poster
                      as='h2'
                      size='lg'
                    >
                      {t.name}
                    </Poster>
                    <Poster
                      as='span'
                      size='lg'
                      tone='faint'
                    >
                      {String(i + 1).padStart(2, '0')}
                    </Poster>
                  </div>
                  {t.description && <Text tone='soft'>{t.description}</Text>}
                  <div className='flex flex-wrap gap-1.5'>
                    <Badge variant='secondary'>
                      {pluralize(exercises, ['упражнение', 'упражнения', 'упражнений'])}
                    </Badge>
                    {t.complexes.map(c => (
                      <Badge
                        key={c.id}
                        variant='outline'
                      >
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                  <div className='mt-1 grid grid-cols-2 gap-2'>
                    <ButtonLink
                      to={buildPath(ROUTES.PROGRAM_TEMPLATE, { templateId: t.id })}
                      variant='outline'
                      size='sm'
                      className='h-11'
                    >
                      <EyeIcon />
                      Посмотреть
                    </ButtonLink>
                    <Button
                      size='sm'
                      className='h-11'
                      disabled={take.isPending}
                      onClick={() =>
                        take.mutate(t.id, {
                          onSuccess: copy => navigate(buildPath(ROUTES.PROGRAM, { programId: copy.id })),
                        })
                      }
                    >
                      <PlusIcon strokeWidth={3} />
                      Взять
                    </Button>
                  </div>
                </Rise>
              )
            })}
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default TemplatesPage
