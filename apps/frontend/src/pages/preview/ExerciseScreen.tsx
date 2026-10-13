import { CirclePlayIcon, FlagIcon, PlusIcon, TriangleAlertIcon } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router'

import { useState } from 'react'

import { splitTechnique } from '@/entities/catalog/lib'
import { EQUIPMENT_LABEL } from '@/entities/catalog/types'
import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { CatalogImage } from '@/shared/ui/kit/CatalogImage'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { StepList } from '@/shared/ui/kit/StepList'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { AddToComplexSheet } from '@/widgets/catalog/AddToComplexSheet'
import { ComplaintSheet } from '@/widgets/catalog/ComplaintSheet'

import { exercises } from './model/catalog'
import { profile, programs } from './model/mock'
import { setDraft, useProgramDraft } from './model/program-drafts'

const activeProgram = programs.find(p => p.active)!

// Карточка упражнения (frontend-tz, 11.2). Открывается и из справочника, и кнопкой «Техника» на тренировке —
// тогда ?from= возвращает туда же
const ExerciseScreen = () => {
  const { exerciseId } = useParams()
  const [search] = useSearchParams()
  const back = search.get('from') ?? ROUTES.PREVIEW_LIBRARY
  const exercise = exercises.find(e => String(e.id) === exerciseId)
  const complexes = useProgramDraft(String(activeProgram.id))
  const [addOpen, setAddOpen] = useState(false)
  const [complaintOpen, setComplaintOpen] = useState(false)

  if (!exercise) {
    return (
      <Screen
        header={
          <TopBar
            back={back}
            title='Упражнение'
          />
        }
        className='px-5'
      >
        <ScreenState
          state='empty'
          title='Упражнение не найдено'
          description='Возможно, его убрали из справочника.'
        />
      </Screen>
    )
  }

  const { points, mistakes } = splitTechnique(exercise.technique)
  // Суставы, на которые у пользователя действует ограничение, подсвечены
  const limited = new Set(profile.limits.map(l => l.zone))

  return (
    <Screen
      header={
        <TopBar
          back={back}
          title={exercise.name}
          subtitle={exercise.equipment ? EQUIPMENT_LABEL[exercise.equipment] : undefined}
        />
      }
      footer={
        <StickyFooter className='grid grid-cols-[1fr_auto] gap-2'>
          <Button
            size='lg'
            onClick={() => setAddOpen(true)}
          >
            <PlusIcon
              className='size-5'
              strokeWidth={2.5}
            />
            В комплекс
          </Button>
          <Button
            variant='outline'
            size='icon-lg'
            className='h-[60px]'
            onClick={() => setComplaintOpen(true)}
            aria-label='Ошибка в описании'
          >
            <FlagIcon className='size-5' />
          </Button>
        </StickyFooter>
      }
      className='gap-7'
    >
      <Rise className='flex flex-col gap-4 px-5'>
        <CatalogImage
          src={exercise.imageUrl}
          alt={exercise.name}
          size='cover'
        />
        <Poster
          as='h1'
          size='2xl'
          className='hyphens-auto'
        >
          {exercise.name}
        </Poster>
        <div className='flex flex-wrap gap-1.5'>
          {exercise.equipment && <Badge variant='secondary'>{EQUIPMENT_LABEL[exercise.equipment]}</Badge>}
          {exercise.status === 'DRAFT' && <Badge variant='outline'>не проверено</Badge>}
        </div>
        {exercise.videoUrl && (
          <ButtonLink
            to={exercise.videoUrl}
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
            {exercise.primaryMuscles.map(m => (
              <Badge key={m.id}>{m.name}</Badge>
            ))}
          </dd>
          {exercise.secondaryMuscles.length > 0 && (
            <>
              <Eyebrow as='dt'>Помогают</Eyebrow>
              <dd className='flex flex-wrap gap-1.5'>
                {exercise.secondaryMuscles.map(m => (
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
          {exercise.joints.length > 0 && (
            <>
              <Eyebrow as='dt'>Суставы</Eyebrow>
              <dd className='flex flex-wrap gap-1.5'>
                {exercise.joints.map(j => (
                  <Badge
                    key={j.id}
                    variant={limited.has(j.name) ? 'destructive' : 'outline'}
                  >
                    {limited.has(j.name) && <TriangleAlertIcon />}
                    {j.name}
                  </Badge>
                ))}
              </dd>
            </>
          )}
        </dl>
        {exercise.joints.some(j => limited.has(j.name)) && (
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
          <ul className='border-destructive/50 flex flex-col gap-2 border-l-2 pl-3'>
            {mistakes.map(m => (
              <Text
                as='li'
                key={m}
                tone='soft'
              >
                {m}
              </Text>
            ))}
          </ul>
        </ScreenSection>
      )}

      <AddToComplexSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        exercise={exercise.name}
        program={activeProgram.title}
        complexes={complexes.map((c, i) => ({
          id: c.id,
          letter: 'ABCDEFGHIJ'[i]!,
          title: c.title,
          count: c.exercises.length,
        }))}
        onPick={complexId =>
          setDraft(String(activeProgram.id), list =>
            list.map(c =>
              c.id === complexId
                ? {
                    ...c,
                    exercises: [
                      ...c.exercises,
                      {
                        id: Date.now(),
                        name: exercise.name,
                        muscles: exercise.primaryMuscles.map(m => m.name).join(' · '),
                        sets: 3,
                        reps: '8–12',
                      },
                    ],
                  }
                : c,
            ),
          )
        }
      />
      <ComplaintSheet
        open={complaintOpen}
        onOpenChange={setComplaintOpen}
        subject={exercise.name}
      />
    </Screen>
  )
}

export default ExerciseScreen
