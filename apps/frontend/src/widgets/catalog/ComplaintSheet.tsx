import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { useState } from 'react'

import { complaintSchema, type ComplaintValues } from '@/entities/catalog/model/schemas'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type ComplaintSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Название записи — чтобы было видно, на что жалуемся */
  subject: string
  onSubmit: (text: string) => Promise<unknown>
}

const ComplaintForm = ({ onSubmit, onSent }: { onSubmit: ComplaintSheetProps['onSubmit']; onSent: () => void }) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintValues>({ resolver: zodResolver(complaintSchema), defaultValues: { text: '' } })

  return (
    <form
      className='flex flex-col gap-3'
      onSubmit={handleSubmit(({ text }) =>
        onSubmit(text)
          .then(onSent)
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <Label htmlFor='complaint'>Что не так</Label>
      <Textarea
        id='complaint'
        placeholder='Например: на картинке другое упражнение'
        maxLength={500}
        aria-invalid={!!errors.text}
        {...register('text')}
      />
      <ErrorText errors={errors.text} />
      <Button
        type='submit'
        className='w-full'
        disabled={isSubmitting}
      >
        Отправить
      </Button>
    </form>
  )
}

// «Ошибка в описании»: жалоба уходит администратору (business-tz, 5.7)
export const ComplaintSheet = ({ open, onOpenChange, subject, onSubmit }: ComplaintSheetProps) => {
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
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{sent ? 'Спасибо!' : 'Ошибка в описании'}</SheetTitle>
          <SheetDescription>
            {sent ? 'Жалоба у администратора. Поправим описание после проверки.' : `«${subject}»`}
          </SheetDescription>
        </SheetHeader>
        <div className='px-gutter flex flex-col gap-3 pb-6'>
          {sent ? (
            <Button
              variant='outline'
              className='w-full'
              onClick={() => close(false)}
            >
              <CheckIcon strokeWidth={3} />
              Готово
            </Button>
          ) : (
            open && (
              <ComplaintForm
                onSubmit={onSubmit}
                onSent={() => setSent(true)}
              />
            )
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
