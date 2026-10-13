import { CheckIcon } from 'lucide-react'

import { useState } from 'react'

import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { Textarea } from '@/shared/ui/shadcn/textarea'

type ComplaintSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Название записи — чтобы было видно, на что жалуемся */
  subject: string
}

// «Ошибка в описании»: жалоба уходит администратору (business-tz, 5.7)
export const ComplaintSheet = ({ open, onOpenChange, subject }: ComplaintSheetProps) => {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setText('')
      setSent(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={close}
    >
      <SheetContent side='bottom'>
        <SheetHeader>
          <SheetTitle>{sent ? 'Спасибо!' : 'Ошибка в описании'}</SheetTitle>
          <SheetDescription>
            {sent ? 'Жалоба у администратора. Поправим описание после проверки.' : `«${subject}»`}
          </SheetDescription>
        </SheetHeader>
        <div className='flex flex-col gap-3 px-5 pb-6'>
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
            <>
              <Label htmlFor='complaint'>Что не так</Label>
              <Textarea
                id='complaint'
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder='Например: на картинке другое упражнение'
                maxLength={500}
              />
              <Button
                className='w-full'
                disabled={text.trim().length < 3}
                onClick={() => setSent(true)}
              >
                Отправить
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
