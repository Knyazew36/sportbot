import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

export type ReplaceChoice = { id: number; name: string; draft?: boolean }

type ReplaceChoiceSheetProps = {
  choice: ReplaceChoice | null
  onClose: () => void
  /** Название упражнения, которое заменяем */
  itemName?: string
  complexName?: string
  /** Тренировка из комплекса программы — тогда доступна замена насовсем */
  canReplaceInComplex: boolean
  pending: boolean
  onApply: (inComplex: boolean) => void
}

// Выбор, как заменить: только на эту тренировку или насовсем в комплексе
export const ReplaceChoiceSheet = ({
  choice,
  onClose,
  itemName,
  complexName,
  canReplaceInComplex,
  pending,
  onApply,
}: ReplaceChoiceSheetProps) => (
  <Sheet
    open={choice != null}
    onOpenChange={open => {
      if (!open) onClose()
    }}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Заменить на «{choice?.name}»</SheetTitle>
        <SheetDescription>
          Только на эту тренировку или насовсем — в «{complexName}» вместо «{itemName}».
        </SheetDescription>
      </SheetHeader>
      <div className='px-gutter flex flex-col gap-3 pb-6'>
        {choice?.draft && (
          <Text
            size='sm'
            tone='muted'
            className='border-primary/60 border-l-2 pl-3'
          >
            Черновик ушёл администратору на проверку — пока с пометкой «не проверено». Бот напишет исход.
          </Text>
        )}
        <Button
          size='lg'
          className='w-full'
          disabled={pending}
          onClick={() => onApply(false)}
        >
          Только сегодня
        </Button>
        <Button
          variant='outline'
          size='lg'
          className='w-full'
          disabled={pending || !canReplaceInComplex}
          onClick={() => onApply(true)}
        >
          Заменить насовсем
        </Button>
      </div>
    </SheetContent>
  </Sheet>
)
