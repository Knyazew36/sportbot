import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, SendIcon } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'

import { useState } from 'react'

import {
  type CatalogExercise,
  type ExerciseProposalInput,
  exerciseProposalSchema,
  type ExerciseProposalValues,
  toTextList,
  useProposeExercise,
  useUploadEntryImage,
} from '@sportbot/api/entities/catalog'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { Textarea } from '@/shared/ui/shadcn/textarea'

import { ExerciseFields } from './ExerciseFields'

const FORM_ID = 'exercise-proposal'

type ExerciseEditSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: CatalogExercise
}

const ProposalForm = ({ exercise, onSent }: { exercise: CatalogExercise; onSent: () => void }) => {
  const propose = useProposeExercise()
  const upload = useUploadEntryImage()
  const form = useForm<ExerciseProposalInput, unknown, ExerciseProposalValues>({
    resolver: zodResolver(exerciseProposalSchema),
    defaultValues: {
      name: exercise.name,
      technique: exercise.technique ?? '',
      steps: toTextList(exercise.steps),
      mistakes: toTextList(exercise.mistakes),
      videoUrl: exercise.videoUrl ?? '',
      equipment: exercise.equipment,
      measure: exercise.measure,
      primary: exercise.primaryMuscles.map(m => m.id),
      secondary: exercise.secondaryMuscles.map(m => m.id),
      jointIds: exercise.joints.map(j => j.id),
      comment: '',
    },
  })
  const { comment: _comment, ...changed } = form.formState.dirtyFields

  return (
    <FormProvider {...form}>
      <form
        id={FORM_ID}
        className='flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain pt-1 pb-4'
        // Бэк сам оставит только реально изменённые поля — шлём форму целиком
        onSubmit={form.handleSubmit(({ comment, ...values }) =>
          propose
            .mutateAsync({ exerciseId: exercise.id, comment: comment || undefined, ...values })
            .then(onSent)
            .catch(error => applyFieldErrors(error, form.setError)),
        )}
      >
        <ExerciseFields
          initialImageUrl={exercise.imageUrl}
          upload={upload}
        />
        <ScreenSection title='Комментарий'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='proposal-comment'>Что было не так</Label>
            <Textarea
              id='proposal-comment'
              placeholder='Например: на картинке другое упражнение'
              maxLength={500}
              aria-invalid={!!form.formState.errors.comment}
              {...form.register('comment')}
            />
            <ErrorText errors={form.formState.errors.comment} />
          </div>
        </ScreenSection>
      </form>
      <SheetFooter className='border-foreground/15 border-t-[1.5px]'>
        <Button
          type='submit'
          form={FORM_ID}
          size='lg'
          className='w-full'
          // Один комментарий — не правка: для него есть жалоба текстом
          disabled={!Object.keys(changed).length || propose.isPending || upload.isPending}
        >
          <SendIcon />
          На модерацию
        </Button>
      </SheetFooter>
    </FormProvider>
  )
}

// «Предложить правку»: пользователь меняет поля упражнения, правка уходит администратору (business-tz, 5.7)
export const ExerciseEditSheet = ({ open, onOpenChange, exercise }: ExerciseEditSheetProps) => {
  const [sent, setSent] = useState(false)

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) setSent(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={close}
    >
      <SheetContent className={sent ? undefined : 'data-[side=bottom]:h-[88svh]'}>
        <SheetHeader>
          <SheetTitle>{sent ? 'Спасибо!' : 'Предложить правку'}</SheetTitle>
          <SheetDescription>
            {sent ? 'Правка у администратора. Бот напишет, когда её проверят.' : `«${exercise.name}»`}
          </SheetDescription>
        </SheetHeader>
        {sent ? (
          <div className='px-gutter flex flex-col gap-3 pb-6'>
            <Button
              variant='outline'
              className='w-full'
              onClick={() => close(false)}
            >
              <CheckIcon strokeWidth={3} />
              Готово
            </Button>
          </div>
        ) : (
          open && (
            <>
              <Text
                size='sm'
                tone='muted'
                className='px-gutter pb-2'
              >
                Поправь, что неверно. Запись изменится после проверки администратором.
              </Text>
              <ProposalForm
                exercise={exercise}
                onSent={() => setSent(true)}
              />
            </>
          )
        )}
      </SheetContent>
    </Sheet>
  )
}
