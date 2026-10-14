import { RepeatIcon } from 'lucide-react'

import { splitTechnique, useCatalogExercise } from '@/entities/catalog'
import { toAssetUrl } from '@/shared/api'
import { CatalogImage } from '@/shared/ui/kit/CatalogImage'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { StepList } from '@/shared/ui/kit/StepList'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

type ExercisePreviewSheetProps = {
  exercise: { id: number; name: string } | null
  onOpenChange: (open: boolean) => void
  onReplace: () => void
}

// Что за упражнение, не уходя с экрана замены: фото, мышцы, техника
const ExercisePreview = ({ id }: { id: number }) => {
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

export const ExercisePreviewSheet = ({ exercise, onOpenChange, onReplace }: ExercisePreviewSheetProps) => (
  <Sheet
    open={exercise != null}
    onOpenChange={onOpenChange}
  >
    <SheetContent side='bottom'>
      <SheetHeader>
        <SheetTitle>{exercise?.name}</SheetTitle>
        <SheetDescription className='sr-only'>Карточка упражнения</SheetDescription>
      </SheetHeader>
      <div className='min-h-0 flex-1 overflow-y-auto px-gutter pb-2'>{exercise && <ExercisePreview id={exercise.id} />}</div>
      <div className='px-gutter pt-2 pb-6'>
        <Button
          size='lg'
          className='w-full'
          onClick={onReplace}
        >
          <RepeatIcon className='size-5' />
          Заменить на это
        </Button>
      </div>
    </SheetContent>
  </Sheet>
)
