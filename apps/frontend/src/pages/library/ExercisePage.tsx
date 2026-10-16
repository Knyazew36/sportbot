import { CirclePlayIcon, PencilLineIcon, PlusIcon, TriangleAlertIcon, XIcon } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router'

import { useState } from 'react'

import { EQUIPMENT_LABEL, splitTechnique, useCatalogExercise } from '@/entities/catalog'
import { useLimitations } from '@/entities/limitation'
import { complexLetter, useActiveProgram, useAddComplexExercises } from '@/entities/program'
import { toAssetUrl } from '@/shared/api'
import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { CatalogImage } from '@/shared/ui/kit/CatalogImage'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StepList } from '@/shared/ui/kit/StepList'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { AddToComplexSheet } from '@/widgets/catalog/AddToComplexSheet'
import { ExerciseEditSheet } from '@/widgets/catalog/ExerciseEditSheet'

// Карточка упражнения (frontend-tz, 11.2). Открывается и из справочника, и кнопкой «Техника» на тренировке —
// тогда ?from= возвращает туда же
const ExercisePage = () => {
  const exerciseId = Number(useParams().exerciseId)
  const [search] = useSearchParams()
  const back = search.get('from') ?? ROUTES.LIBRARY
  const exercise = useCatalogExercise(exerciseId)
  const limitations = useLimitations()
  const program = useActiveProgram()
  const add = useAddComplexExercises()
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  return (
    <Screen
      header={
        <TopBar
          back={back}
          title={exercise.data?.name ?? 'Упражнение'}
          subtitle={exercise.data?.equipment ? EQUIPMENT_LABEL[exercise.data.equipment] : undefined}
        />
      }
      footer={
        exercise.data && (
          <StickyFooter>
            <Button
              variant='outline'
              size='icon-lg'
              className='size-[68px]'
              onClick={() => setEditOpen(true)}
              aria-label='Предложить правку'
            >
              <PencilLineIcon className='size-6' />
            </Button>
            <Button
              size='xl'
              disabled={!program.data}
              onClick={() => setAddOpen(true)}
            >
              <PlusIcon
                className='size-6'
                strokeWidth={2.5}
              />
              {program.data ? 'В комплекс' : 'Нет активной программы'}
            </Button>
          </StickyFooter>
        )
      }
      className='gap-7'
    >
      <QueryScreen query={exercise}>
        {e => {
          const { points, mistakes } = splitTechnique(e.technique)
          // Суставы, на которые у пользователя действует ограничение, подсвечены
          const limited = new Set(limitations.data?.map(l => l.jointId))
          return (
            <>
              <Rise className='px-gutter flex flex-col gap-4'>
                <CatalogImage
                  src={toAssetUrl(e.imageUrl) ?? null}
                  alt={e.name}
                  size='cover'
                />
                <Poster
                  as='h1'
                  size='2xl'
                  className='hyphens-auto'
                >
                  {e.name}
                </Poster>
                <div className='flex flex-wrap gap-1.5'>
                  {e.equipment && <Badge variant='secondary'>{EQUIPMENT_LABEL[e.equipment]}</Badge>}
                  {e.draft && <Badge variant='outline'>не проверено</Badge>}
                </div>
                {e.videoUrl && (
                  <ButtonLink
                    to={e.videoUrl}
                    variant='outline'
                    size='sm'
                    className='self-start'
                  >
                    <CirclePlayIcon />
                    Видео техники
                  </ButtonLink>
                )}
              </Rise>

              <ScreenSection title='Мышцы'>
                <dl className='grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-3'>
                  <Eyebrow as='dt'>Основные</Eyebrow>
                  <dd className='flex flex-wrap gap-1.5'>
                    {e.primaryMuscles.map(m => (
                      <Badge key={m.id}>{m.name}</Badge>
                    ))}
                  </dd>
                  {e.secondaryMuscles.length > 0 && (
                    <>
                      <Eyebrow as='dt'>Помогают</Eyebrow>
                      <dd className='flex flex-wrap gap-1.5'>
                        {e.secondaryMuscles.map(m => (
                          <Badge
                            key={m.id}
                            variant='outline'
                          >
                            {m.name}
                          </Badge>
                        ))}
                      </dd>
                    </>
                  )}
                  {e.joints.length > 0 && (
                    <>
                      <Eyebrow as='dt'>Суставы под нагрузкой</Eyebrow>
                      <dd className='flex flex-wrap gap-1.5'>
                        {e.joints.map(j => (
                          <Badge
                            key={j.id}
                            variant={limited.has(j.id) ? 'destructive' : 'outline'}
                          >
                            {limited.has(j.id) && <TriangleAlertIcon />}
                            {j.name}
                          </Badge>
                        ))}
                      </dd>
                    </>
                  )}
                </dl>
                {e.joints.some(j => limited.has(j.id)) && (
                  <Text
                    size='sm'
                    tone='danger'
                  >
                    Нагружает сустав, на котором у тебя ограничение.
                  </Text>
                )}
              </ScreenSection>

              {points.length > 0 && (
                <ScreenSection title='Техника'>
                  <StepList items={points} />
                </ScreenSection>
              )}

              {mistakes.length > 0 && (
                <ScreenSection title='Типичные ошибки'>
                  {/* Сетка как у StepList: крестики встают в колонку цифр техники, и два списка читаются одной лесенкой */}
                  <ul className='flex flex-col gap-1.5'>
                    {mistakes.map(m => (
                      <li
                        key={m}
                        className='grid grid-cols-[24px_1fr] items-start gap-2'
                      >
                        <XIcon
                          className='text-destructive mt-[3px] size-3.5'
                          strokeWidth={3.5}
                          aria-hidden
                        />
                        <Text
                          as='span'
                          tone='soft'
                          className='first-letter:uppercase'
                        >
                          {m}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </ScreenSection>
              )}

              {program.data && (
                <AddToComplexSheet
                  open={addOpen}
                  onOpenChange={setAddOpen}
                  exercise={e.name}
                  program={program.data.name}
                  complexes={program.data.complexes.map((c, i) => ({
                    id: c.id,
                    letter: complexLetter(i),
                    title: c.name,
                    count: c.exercises.length,
                  }))}
                  onPick={complexId => add.mutateAsync({ complexId, exerciseIds: [e.id] })}
                />
              )}
              <ExerciseEditSheet
                open={editOpen}
                onOpenChange={setEditOpen}
                exercise={e}
              />
            </>
          )
        }}
      </QueryScreen>
    </Screen>
  )
}

export default ExercisePage
