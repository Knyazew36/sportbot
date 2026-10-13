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

type ConfirmActionProps = {
  /** Кнопка-триггер, например <Button variant="destructive" /> */
  trigger: React.ReactElement
  children: React.ReactNode
  title: string
  description?: React.ReactNode
  confirmLabel?: string
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
  onConfirm,
}: ConfirmActionProps) => {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

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
      onOpenChange={setOpen}
    >
      <AlertDialogTrigger render={trigger}>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={pending}
            onClick={confirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
