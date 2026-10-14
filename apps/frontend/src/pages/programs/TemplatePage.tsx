import { PlusIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { complexLetter, planText, useTakeTemplate, useTemplates } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Ticket } from '@/shared/ui/kit/Ticket'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Шаблон целиком: что за тренировки внутри, прежде чем брать себе (frontend-tz, 10.2).
// Отдельного запроса нет — шаблоны приходят списком с составом
const TemplatePage = () => {
  const templateId = Number(useParams().templateId)
  const templates = useTemplates()
  const take = useTakeTemplate()
  const navigate = useNavigate()
  const template = templates.data?.find(t => t.id === templateId)

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.PROGRAM_TEMPLATES}
          title={template?.name ?? 'Шаблон'}
          subtitle='шаблон'
        />
      }
      footer={
        template && (
          <StickyFooter>
            <Button
              size='lg'
              className='w-full justify-between'
              disabled={take.isPending}
              onClick={() =>
                take.mutate(template.id, {
                  onSuccess: copy => navigate(buildPath(ROUTES.PROGRAM, { programId: copy.id })),
                })
              }
            >
              Взять себе
              <PlusIcon
                className='size-6'
                strokeWidth={2.5}
              />
            </Button>
          </StickyFooter>
        )
      }
    >
      <QueryScreen
        query={templates}
        isEmpty={list => !list.some(t => t.id === templateId)}
        empty={{
          title: 'Шаблон не найден',
          description: 'Возможно, его убрали из каталога.',
          action: (
            <ButtonLink
              to={ROUTES.PROGRAM_TEMPLATES}
              variant='outline'
              size='sm'
            >
              К шаблонам
            </ButtonLink>
          ),
        }}
      >
        {list => {
          const t = list.find(x => x.id === templateId)!
          const exercises = t.complexes.reduce((sum, c) => sum + c.exercises.length, 0)
          return (
            <>
              <Rise className='px-gutter'>
                <Poster
                  as='h1'
                  size='3xl'
                  tone='primary'
                  className='hyphens-auto'
                >
                  {t.name}
                </Poster>
                {t.description && (
                  <Text
                    tone='soft'
                    className='mt-3'
                  >
                    {t.description}
                  </Text>
                )}
              </Rise>

              <Rise className='px-gutter'>
                <StatGrid
                  items={[
                    { label: 'комплексов', value: t.complexes.length },
                    { label: 'упражнений', value: exercises },
                  ]}
                />
              </Rise>

              <ScreenSection
                title='Очередь комплексов'
                aside='по кругу, с первого'
                bleed
              >
                <ol className='no-scrollbar flex gap-2 overflow-x-auto px-gutter'>
                  {t.complexes.map((c, i) => (
                    <li key={c.id}>
                      <Ticket
                        mark={complexLetter(i)}
                        title={c.name}
                        active={i === 0}
                      >
                        <Eyebrow>{c.exercises.length} упр.</Eyebrow>
                      </Ticket>
                    </li>
                  ))}
                </ol>
              </ScreenSection>

              {t.complexes.map((c, i) => (
                <ScreenSection
                  key={c.id}
                  title={`${complexLetter(i)} · ${c.name}`}
                  aside={`${c.exercises.reduce((sum, e) => sum + e.sets, 0)} подходов`}
                >
                  <List>
                    {c.exercises.map((e, j) => (
                      <ListRow
                        key={e.id}
                        lead={String(j + 1).padStart(2, '0')}
                        title={e.name}
                        meta={e.muscles}
                        trail={
                          <Poster
                            as='span'
                            size='sm'
                            className='whitespace-nowrap'
                          >
                            {planText(e.sets, e.repsMin, e.repsMax)}
                          </Poster>
                        }
                      />
                    ))}
                  </List>
                </ScreenSection>
              ))}

              <Rise className='px-gutter'>
                <Text
                  size='xs'
                  tone='muted'
                >
                  После «Взять» шаблон становится твоей программой — его можно править.
                </Text>
              </Rise>
            </>
          )
        }}
      </QueryScreen>
    </Screen>
  )
}

export default TemplatePage
