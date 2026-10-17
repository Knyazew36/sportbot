import { PlusIcon } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { useState } from 'react'

import {
  addedText,
  type CatalogSource,
  complexLetter,
  planText,
  SOURCE_PARAM,
  useTakeTemplate,
  useTemplates,
} from '@/entities/program'
import { toAssetUrl } from '@/shared/api'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ComplexQueue } from '@/widgets/complex-queue/ComplexQueue'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { EXERCISE_FORMS, SET_FORMS } from '@/shared/lib/plural-forms'

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
  // Упражнение, открытое в шторке: состав видно, не уходя со страницы шаблона
  const [opened, setOpened] = useState<{ id: number; name: string } | null>(null)

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
        template &&
        (template.mine ? (
          // Своя программа: брать копию у себя незачем — открываем её редактор
          <StickyFooter>
            <ButtonLink
              to={buildPath(ROUTES.PROGRAM, { programId: template.id })}
              size='lg'
              className='w-full'
            >
              Открыть мою
            </ButtonLink>
          </StickyFooter>
        ) : (
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
              size='lg'
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
        ))
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
                {t.author && (
                  <div className='mt-3 flex items-center gap-2'>
                    <PersonAvatar
                      name={t.author.name}
                      src={toAssetUrl(t.author.avatarUrl)}
                      size='sm'
                    />
                    <Text
                      size='sm'
                      tone='muted'
                    >
                      {t.mine ? 'Твоя программа' : t.author.name}
                    </Text>
                  </div>
                )}
                {t.description && (
                  <Text
                    tone='soft'
                    className='mt-3'
                  >
                    {t.description}
                  </Text>
                )}
                <Eyebrow
                  as='p'
                  className='mt-3'
                >
                  {addedText(t.addedCount)}
                </Eyebrow>
              </Rise>

              <Rise className='px-gutter'>
                <StatGrid
                  items={[
                    { label: 'комплексов', value: t.complexes.length },
                    { label: pluralize(exercises, EXERCISE_FORMS, { withCount: false }), value: exercises },
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
                  aside={pluralize(
                    c.exercises.reduce((sum, e) => sum + e.sets, 0),
                    SET_FORMS,
                  )}
                >
                  <List>
                    <ExerciseBlocks items={c.exercises}>
                      {(e, j, label) => (
                      // Вся строка открывает карточку упражнения: кнопка растянута на строку
                      <ListRow
                        key={e.id}
                        // В суперсете строка внутри рамки: на всю ширину экрана подсветка её перекрыла бы
                        className={cn(
                          'hover:bg-accent/60 relative transition-colors',
                          !label && '-mx-gutter px-gutter',
                        )}
                        lead={label ?? String(j + 1).padStart(2, '0')}
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
                            {planText(e.sets, e.repsMin, e.repsMax, e.measure)}
                          </Poster>
                        }
                      />
                      )}
                    </ExerciseBlocks>
                  </List>
                </ScreenSection>
              ))}

              <Rise className='px-gutter'>
                <Text
                  size='xs'
                  tone='muted'
                >
                  После «Взять» копия становится твоей программой — её можно править.
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
