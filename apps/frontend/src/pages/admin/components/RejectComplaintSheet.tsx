import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { rejectComplaintSchema, type RejectComplaintValues, useCloseComplaint } from '@/entities/admin'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type RejectComplaintSheetProps = {
  /** Жалоба, которую отклоняем; null — шторка закрыта */
  complaint: { id: number; entryName: string; isProposal: boolean } | null
  onClose: () => void
}

const RejectForm = ({ id, onDone }: { id: number; onDone: () => void }) => {
  const close = useCloseComplaint()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RejectComplaintValues>({ resolver: zodResolver(rejectComplaintSchema), defaultValues: { reason: '' } })

  return (
    <form
      className='px-gutter flex flex-col gap-3 pb-6'
      onSubmit={handleSubmit(({ reason }) =>
        close
          .mutateAsync({ id, status: 'REJECTED', reason: reason || undefined })
          .then(onDone)
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <Label htmlFor='reject-reason'>Причина</Label>
      <Textarea
        id='reject-reason'
        placeholder='Например: на картинке как раз верное упражнение'
        maxLength={200}
        aria-invalid={!!errors.reason}
        {...register('reason')}
      />
      <ErrorText errors={errors.reason} />
      <Button
        type='submit'
        variant='destructive'
        className='w-full'
        disabled={close.isPending}
      >
        Отклонить
      </Button>
    </form>
  )
}

// Отказ с причиной: бот перешлёт её автору жалобы или правки
export const RejectComplaintSheet = ({ complaint, onClose }: RejectComplaintSheetProps) => (
  <Sheet
    open={!!complaint}
    onOpenChange={open => !open && onClose()}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>{complaint?.isProposal ? 'Отклонить правку' : 'Отклонить жалобу'}</SheetTitle>
        <SheetDescription>{complaint && `«${complaint.entryName}» · причину увидит автор`}</SheetDescription>
      </SheetHeader>
      {complaint && (
        <RejectForm
          key={complaint.id}
          id={complaint.id}
          onDone={onClose}
        />
      )}
    </SheetContent>
  </Sheet>
)
