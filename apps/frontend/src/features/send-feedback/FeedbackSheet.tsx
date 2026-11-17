import { zodResolver } from '@hookform/resolvers/zod'
import { feedbackSchema, type FeedbackValues, useSendFeedback } from '@sportbot/api/entities/feedback'
import { useForm } from 'react-hook-form'

import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type FeedbackSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FeedbackForm = ({ onDone }: { onDone: () => void }) => {
  const send = useSendFeedback()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FeedbackValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { text: '' },
  })

  return (
    <form
      className='px-gutter flex flex-col gap-3 pb-6'
      onSubmit={handleSubmit(values =>
        send
          .mutateAsync(values)
          .then(onDone)
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <Label htmlFor='feedback-text'>Твоё сообщение</Label>
      <Textarea
        id='feedback-text'
        placeholder='Что бесит, что сломалось, чего не хватает? Хоть одна строчка — мы читаем каждое сообщение'
        maxLength={1000}
        rows={5}
        aria-invalid={!!errors.text}
        {...register('text')}
      />
      <ErrorText errors={errors.text} />
      <Button
        type='submit'
        className='w-full'
        disabled={send.isPending}
      >
        Отправить
      </Button>
    </form>
  )
}

// Идея: короткое сообщение команде прямо с главной
export const FeedbackSheet = ({ open, onOpenChange }: FeedbackSheetProps) => (
  <Sheet
    open={open}
    onOpenChange={onOpenChange}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Идея</SheetTitle>
        <SheetDescription>
          Нашёл баг, неудобное место или придумал, чего не хватает? Напиши — приложение делается под вас, и ваши слова
          решают, что мы поправим первым
        </SheetDescription>
      </SheetHeader>
      {/* Форма монтируется только при открытии, поэтому поля сбрасываются сами */}
      {open && <FeedbackForm onDone={() => onOpenChange(false)} />}
    </SheetContent>
  </Sheet>
)
