import type { CooldownStretch } from '@sportbot/api/entities/workout'
import { toAssetUrl } from '@/shared/api'
import { List } from '@/shared/ui/kit/ListRow'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

type StretchListSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  main: CooldownStretch[]
  optional: CooldownStretch[]
  minutes: number
  current: number | null
  onPick: (index: number) => void
  /** Тап по строке — карточка растяжки поверх списка */
  onOpen: (stretch: CooldownStretch) => void
}

// Вся заминка разом (frontend-tz, 9.2): из любого места можно перейти к любой растяжке
export const StretchListSheet = ({
  open,
  onOpenChange,
  main,
  optional,
  minutes,
  current,
  onPick,
  onOpen,
}: StretchListSheetProps) => {
  const blocks = [
    { title: 'Основной блок', list: main, offset: 0 },
    { title: 'Если есть время', list: optional, offset: main.length },
  ].filter(b => b.list.length)

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Вся заминка</SheetTitle>
          <Eyebrow tone='primary'>~{minutes} мин</Eyebrow>
        </SheetHeader>
        <div className='flex min-h-0 flex-col gap-4 overflow-y-auto px-gutter pb-5'>
          {blocks.map(block => (
            <div key={block.title}>
              <Eyebrow
                as='p'
                className='mb-2'
              >
                {block.title}
              </Eyebrow>
              <List>
                {block.list.map((s, i) => {
                  const index = block.offset + i
                  return (
                    <CatalogRow
                      key={s.id}
                      name={s.name}
                      imageUrl={toAssetUrl(s.imageUrl) ?? null}
                      meta={`${s.muscles} · ${s.holdSeconds} с${s.perSide ? ' × 2' : ''}`}
                      selected={index === current}
                      onClick={() => onOpen(s)}
                      trail={
                        <Button
                          variant={index === current ? 'default' : 'outline'}
                          size='xs'
                          onClick={() => {
                            onPick(index)
                            onOpenChange(false)
                          }}
                        >
                          {index === current ? 'Сейчас' : 'Перейти'}
                        </Button>
                      }
                    />
                  )
                })}
              </List>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
