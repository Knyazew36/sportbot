import { type Equipment, EQUIPMENT_LABEL } from '@sportbot/api/entities/catalog'
import { OptionButton } from '@/shared/ui/kit/OptionButton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

/** Инвентарь простыми словами: где и с чем делать */
const EQUIPMENT_HINT: Record<Equipment, string> = {
  BARBELL: 'гриф с блинами, в зале',
  DUMBBELL: 'можно и дома, если есть гантели',
  MACHINE: 'тренажёры и блоки в зале',
  BODYWEIGHT: 'без снарядов, где угодно',
}

const OPTIONS: { value: Equipment | 'ALL'; title: string; meta: string }[] = [
  { value: 'ALL', title: 'Любой', meta: 'показать всё' },
  ...(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map(value => ({
    value,
    title: EQUIPMENT_LABEL[value],
    meta: EQUIPMENT_HINT[value],
  })),
]

type EquipmentFilterSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: Equipment | 'ALL'
  onValueChange: (equipment: Equipment | 'ALL') => void
}

// Выбор инвентаря: один вариант, тап сразу применяет и закрывает шторку
export const EquipmentFilterSheet = ({ open, onOpenChange, value, onValueChange }: EquipmentFilterSheetProps) => (
  <Sheet
    open={open}
    onOpenChange={onOpenChange}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>С чем занимаешься?</SheetTitle>
      </SheetHeader>
      <div className='px-gutter flex flex-col gap-2 pt-1 pb-6'>
        {OPTIONS.map(o => (
          <OptionButton
            key={o.value}
            title={o.title}
            meta={o.meta}
            selected={value === o.value}
            onClick={() => {
              onValueChange(o.value)
              onOpenChange(false)
            }}
          />
        ))}
      </div>
    </SheetContent>
  </Sheet>
)
