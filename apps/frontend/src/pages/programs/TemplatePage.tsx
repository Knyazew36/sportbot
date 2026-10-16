import { PlusIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { useState } from 'react'

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
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ComplexQueue } from '@/widgets/complex-queue/ComplexQueue'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'

// Шаблон целиком: что за тренировки внутри, прежде чем брать себе (frontend-tz, 10.2).
// Отдельного запроса нет — шаблоны приходят списком с составом
const TemplatePage = () => {
  const templateId = Number(useParams().templateId)
  const templates = useTemplates()
  const take = useTakeTemplate()
  const navigate = useNavigate()
  const template = templates.data?.find(t => t.id === templateId)
  // Упражнение, открытое в шторке: состав видно, не уходя со страницы шаблона
  const [opened, setOpened] = useState<{ id: number; name: string } | null>(null)

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
          // Две кнопки держим в одну строку: обе lg и короткие подписи, чтобы влезали от 375px
          <StickyFooter className='flex-nowrap'>
            {/* Уже взят — главное «Открыть»; второй экземпляр берут осознанно, отсюда, а не из каталога */}
            {template.takenProgramId != null && (
              <ButtonLink
                to={buildPath(ROUTES.PROGRAM, { programId: template.takenProgramId })}
                size='lg'
                className='flex-1'
              >
                Открыть мою
              </ButtonLink>
            )}
            <Button
              size={template.takenProgramId != null ? 'lg' : 'xl'}
              variant={template.takenProgramId != null ? 'outline' : 'default'}
              disabled={take.isPending}
              onClick={() =>
                take.mutate(template.id, {
                  onSuccess: copy => navigate(buildPath(ROUTES.PROGRAM, { programId: copy.id })),
                })
              }
            >
              {template.takenProgramId != null ? 'Ещё раз' : 'Взять себе'}
              <PlusIcon
                className={template.takenProgramId != null ? 'size-5' : 'size-7'}
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
              В каталог
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

              <ComplexQueue
                complexes={t.complexes}
                activeId={t.complexes[0]?.id}
                aside='по кругу, с первого'
              />

              {t.complexes.map((c, i) => (
                <ScreenSection
                  key={c.id}
                  title={`${complexLetter(i)} · ${c.name}`}
                  aside={`${c.exercises.reduce((sum, e) => sum + e.sets, 0)} подходов`}
                >
                  <List>
                    {c.exercises.map((e, j) => (
                      // Вся строка открывает карточку упражнения: кнопка растянута на строку
                      <ListRow
                        key={e.id}
                        className='hover:bg-accent/60 -mx-gutter px-gutter relative transition-colors'
                        lead={String(j + 1).padStart(2, '0')}
                        title={
                          <button
                            type='button'
                            className='text-left after:absolute after:inset-0'
                            onClick={() => setOpened({ id: e.exerciseId, name: e.name })}
                          >
                            {e.name}
                          </button>
                        }
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

      <ExerciseSheet
        exercise={opened}
        onOpenChange={open => !open && setOpened(null)}
        action={
          opened && (
            <ButtonLink
              to={buildPath(ROUTES.EXERCISE, { exerciseId: opened.id })}
              variant='outline'
              size='lg'
              className='w-full'
            >
              Подробнее в справочнике
            </ButtonLink>
          )
        }
      />
    </Screen>
  )
}

export default TemplatePage
