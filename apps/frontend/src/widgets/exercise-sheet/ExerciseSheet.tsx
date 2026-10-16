import type { ReactNode } from 'react'

import { type CatalogKind, splitTechnique, useCatalogExercise, useCatalogStretch } from '@/entities/catalog'
import { toAssetUrl } from '@/shared/api'
import { CatalogImage } from '@/shared/ui/kit/CatalogImage'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { StepList } from '@/shared/ui/kit/StepList'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Badge } from '@/shared/ui/shadcn/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

type ExerciseSheetProps = {
  /** Открытое упражнение; null — шторка закрыта. Название сразу в заголовке, пока карточка грузится */
  exercise: { id: number; name: string } | null
  /** Растяжка показывается своей карточкой: удержание и «как делать» вместо техники */
  kind?: CatalogKind
  onOpenChange: (open: boolean) => void
  /** Действие внизу шторки: «Заменить на это», «Подробнее» */
  action?: ReactNode
}

// Карточка упражнения: фото, мышцы, техника
const ExerciseDetails = ({ id }: { id: number }) => {
  const exercise = useCatalogExercise(id)
  return (
    <QueryScreen
      query={exercise}
      className=''
    >
      {e => {
        const { points } = splitTechnique(e.technique)
        return (
          <div className='flex flex-col gap-4'>
            <CatalogImage
              src={toAssetUrl(e.imageUrl) ?? null}
              alt={e.name}
              size='cover'
            />
            <div className='flex flex-wrap gap-1.5'>
              {e.primaryMuscles.map(m => (
                <Badge key={m.id}>{m.name}</Badge>
              ))}
              {e.secondaryMuscles.map(m => (
                <Badge
                  key={m.id}
                  variant='outline'
                >
                  {m.name}
                </Badge>
              ))}
            </div>
            {points.length > 0 && (
              <div className='flex flex-col gap-2'>
                <Eyebrow>Техника</Eyebrow>
                <StepList items={points} />
              </div>
            )}
          </div>
        )
      }}
    </QueryScreen>
  )
}

// Карточка растяжки: фото, мышцы, удержание, как делать
const StretchDetails = ({ id }: { id: number }) => {
  const stretch = useCatalogStretch(id)
  return (
    <QueryScreen
      query={stretch}
      className=''
    >
      {s => (
        <div className='flex flex-col gap-4'>
          <CatalogImage
            src={toAssetUrl(s.imageUrl) ?? null}
            alt={s.name}
            size='cover'
          />
          <div className='flex flex-wrap gap-1.5'>
            {s.muscles.map(m => (
              <Badge key={m.id}>{m.name}</Badge>
            ))}
          </div>
          <div className='flex flex-col gap-2'>
            <Eyebrow>Удержание</Eyebrow>
            <Text>
              {s.holdSeconds} с{s.perSide ? ', на каждую сторону' : ''}
            </Text>
          </div>
          {s.howTo && (
            <div className='flex flex-col gap-2'>
              <Eyebrow>Как делать</Eyebrow>
              <Text className='leading-relaxed'>{s.howTo}</Text>
            </div>
          )}
        </div>
      )}
    </QueryScreen>
  )
}

// Что за упражнение, не уходя с экрана: замена на тренировке, состав шаблона, похожие в модерации
export const ExerciseSheet = ({ exercise, kind = 'exercise', onOpenChange, action }: ExerciseSheetProps) => (
  <Sheet
    open={exercise != null}
    onOpenChange={onOpenChange}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>{exercise?.name}</SheetTitle>
        <SheetDescription className='sr-only'>
          {kind === 'exercise' ? 'Карточка упражнения' : 'Карточка растяжки'}
        </SheetDescription>
      </SheetHeader>
      <div className='px-gutter min-h-0 flex-1 overflow-y-auto pb-2'>
        {exercise && (kind === 'exercise' ? <ExerciseDetails id={exercise.id} /> : <StretchDetails id={exercise.id} />)}
      </div>
      <div className='px-gutter pt-2 pb-6'>{action}</div>
    </SheetContent>
  </Sheet>
)
