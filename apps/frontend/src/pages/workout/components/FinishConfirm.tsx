import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/shadcn/alert-dialog'

type FinishConfirmProps = {
  open: boolean
  /** Сколько упражнений не доведено до плана: ни одного подхода или меньше запланированного */
  unfinished: number
  onClose: () => void
  onConfirm: () => void
}

// Завершение с кнопки «дальше» при недоделанном плане: спрашиваем, чтобы не закрыть тренировку случайным тапом
export const FinishConfirm = ({ open, unfinished, onClose, onConfirm }: FinishConfirmProps) => (
  <AlertDialog
    open={open}
    onOpenChange={next => !next && onClose()}
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Завершить тренировку?</AlertDialogTitle>
        <AlertDialogDescription>
          Не все подходы сделаны. Упражнений не по плану: {unfinished}.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Продолжить</AlertDialogCancel>
        <AlertDialogAction
          variant='default'
          onClick={onConfirm}
        >
          Завершить
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
