import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/shadcn/alert-dialog'
import { Input } from '@/shared/ui/shadcn/input'

type ConfirmActionProps = {
  /** Кнопка-триггер, например <Button variant="destructive" /> */
  trigger: React.ReactElement
  children: React.ReactNode
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  /** Слово, которое нужно ввести для подтверждения — для самых необратимых действий вроде удаления всех данных */
  confirmWord?: string
  /** Необратимое удаление — красная кнопка; подтверждение обычного действия (завершить тренировку) — синяя */
  confirmVariant?: 'destructive' | 'default'
  /** Окно закрывается, когда промис выполнится; при ошибке остаётся открытым */
  onConfirm: () => Promise<unknown> | void
}

// Подтверждение необратимого действия: удаление, исключение, выход
export const ConfirmAction = ({
  trigger,
  children,
  title,
  description,
  confirmLabel = 'Подтвердить',
  confirmWord,
  confirmVariant = 'destructive',
  onConfirm,
}: ConfirmActionProps) => {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [typed, setTyped] = useState('')
  const wordMatches = !confirmWord || typed.trim().toLowerCase() === confirmWord

  const confirm = async () => {
    setPending(true)
    try {
      await onConfirm()
      setOpen(false)
    } catch {
      // текст ошибки показывает вызывающий код (toast в onError мутации)
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (!next) setTyped('')
      }}
    >
      <AlertDialogTrigger render={trigger}>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {confirmWord && (
          <Input
            value={typed}
            onChange={e => setTyped(e.target.value)}
            placeholder={`Введите «${confirmWord}»`}
            aria-label={`Введите слово «${confirmWord}» для подтверждения`}
            autoComplete='off'
          />
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            variant={confirmVariant}
            disabled={pending || !wordMatches}
            onClick={confirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
