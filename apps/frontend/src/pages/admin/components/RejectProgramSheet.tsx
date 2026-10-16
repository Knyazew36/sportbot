import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import {
  rejectProgramSchema,
  type RejectProgramValues,
  useRejectProgramReview,
  useTakeDownProgram,
} from '@/entities/admin'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { Textarea } from '@/shared/ui/shadcn/textarea'

/** reject — отказ в публикации или правке текста; takeDown — снять опубликованную из каталога */
export type ProgramRejectMode = 'reject' | 'takeDown'

type RejectProgramSheetProps = {
  program: { id: number; name: string }
  /** null — шторка закрыта */
  mode: ProgramRejectMode | null
  onClose: () => void
  onDone: () => void
}

const RejectForm = ({ id, mode, onDone }: { id: number; mode: ProgramRejectMode; onDone: () => void }) => {
  const reject = useRejectProgramReview()
  const takeDown = useTakeDownProgram()
  const mutation = mode === 'reject' ? reject : takeDown
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RejectProgramValues>({ resolver: zodResolver(rejectProgramSchema), defaultValues: { reason: '' } })

  return (
    <form
      className='px-gutter flex flex-col gap-3 pb-6'
      onSubmit={handleSubmit(({ reason }) =>
        mutation
          .mutateAsync({ id, reason })
          .then(onDone)
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <Label htmlFor='program-reject-reason'>Причина</Label>
      <Textarea
        id='program-reject-reason'
        placeholder='Например: в описании реклама, или упражнения не подходят новичкам, как заявлено'
        maxLength={200}
        aria-invalid={!!errors.reason}
        {...register('reason')}
      />
      <ErrorText errors={errors.reason} />
      <Button
        type='submit'
        variant='destructive'
        className='w-full'
        disabled={mutation.isPending}
      >
        {mode === 'reject' ? 'Отклонить' : 'Снять из каталога'}
      </Button>
    </form>
  )
}

// Отказ с причиной: бот перешлёт её автору, он исправит и отправит снова
export const RejectProgramSheet = ({ program, mode, onClose, onDone }: RejectProgramSheetProps) => (
  <Sheet
    open={!!mode}
    onOpenChange={open => !open && onClose()}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>{mode === 'takeDown' ? 'Снять из каталога' : 'Отклонить'}</SheetTitle>
        <SheetDescription>«{program.name}» · причину увидит автор</SheetDescription>
      </SheetHeader>
      {mode && (
        <RejectForm
          key={mode}
          id={program.id}
          mode={mode}
          onDone={onDone}
        />
      )}
    </SheetContent>
  </Sheet>
)
