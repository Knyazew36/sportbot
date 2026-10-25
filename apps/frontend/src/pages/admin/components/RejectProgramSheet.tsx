import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import {
  rejectProgramSchema,
  useDeleteProgramReview,
  type RejectProgramValues,
  useRejectProgramReview,
  useTakeDownProgram,
} from '@sportbot/api/entities/admin'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { Textarea } from '@/shared/ui/shadcn/textarea'

/** reject — отказ в публикации или правке текста; takeDown — снять опубликованную из каталога; remove — удалить совсем */
export type ProgramRejectMode = 'reject' | 'takeDown' | 'remove'

const TEXT: Record<ProgramRejectMode, { title: string; action: string; note: string }> = {
  reject: { title: 'Отклонить', action: 'Отклонить', note: 'причину увидит автор' },
  takeDown: { title: 'Снять из каталога', action: 'Снять из каталога', note: 'причину увидит автор' },
  remove: {
    title: 'Удалить совсем',
    action: 'Удалить совсем',
    note: 'программа пропадёт и у автора, копии у взявших останутся',
  },
}

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
  const remove = useDeleteProgramReview()
  const mutation = { reject, takeDown, remove }[mode]
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
        {TEXT[mode].action}
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
        <SheetTitle>{TEXT[mode ?? 'reject'].title}</SheetTitle>
        <SheetDescription>
          «{program.name}» · {TEXT[mode ?? 'reject'].note}
        </SheetDescription>
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
