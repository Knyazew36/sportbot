import { SlidersHorizontalIcon } from 'lucide-react'

import { type ReactNode, useState } from 'react'

import type { ProgramTagGroup, TagSelection } from '@/entities/program'
import { CHIP_ALL, ChipFilter } from '@/shared/ui/kit/ChipFilter'
import { SearchField } from '@/shared/ui/kit/SearchField'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

type TemplateFilterProps = {
  groups: ProgramTagGroup[]
  selection: TagSelection
  onSelectionChange: (selection: TagSelection) => void
  search: string
  onSearchChange: (search: string) => void
  /** Дополнительные фильтры шторки (источник, сортировка) — над группами тегов */
  more?: ReactNode
  /** Сколько из дополнительных фильтров включено — для счётчика на кнопке */
  moreActive?: number
  /** Сброс всего: без него в шторке нет «Сбросить» */
  onReset?: () => void
  /** Подпись главной кнопки шторки: «Показать 12 программ» */
  showLabel?: string
}

// Подбор программы: поиск и один ряд быстрых чипов первой группы — список сразу под ними, а не под стеной фильтров.
// Остальные группы и доп. фильтры — в шторке, счётчик на кнопке говорит, что там что-то включено.
// Внутри группы — один чип, между группами — все сразу. Общий для каталога и шага программы онбординга
export const TemplateFilter = ({
  groups,
  selection,
  onSelectionChange,
  search,
  onSearchChange,
  more,
  moreActive = 0,
  onReset,
  showLabel = 'Показать',
}: TemplateFilterProps) => {
  const [open, setOpen] = useState(false)
  const [quick, ...rest] = groups
  const hidden = rest.filter(g => selection[g.code]).length + moreActive
  const withSheet = rest.length > 0 || more != null

  const pick = (groupCode: string, tagCode: string) => {
    const { [groupCode]: _, ...others } = selection
    onSelectionChange(tagCode === CHIP_ALL ? others : { ...others, [groupCode]: tagCode })
  }

  const chips = (g: ProgramTagGroup) => (
    <ChipFilter
      options={g.tags.map(t => ({ value: t.code, label: t.name }))}
      value={selection[g.code] ?? CHIP_ALL}
      onValueChange={next => pick(g.code, next)}
    />
  )

  return (
    <div className='flex flex-col gap-2.5'>
      <div className='flex gap-2'>
        <SearchField
          value={search}
          onValueChange={onSearchChange}
          placeholder='Название или для кого'
          className='min-w-0 flex-1'
        />
        {withSheet && (
          <Button
            type='button'
            variant={hidden ? 'default' : 'outline'}
            size='icon'
            // Высота поля поиска — кнопка стоит с ним в одну строку
            className='relative size-12 shrink-0'
            onClick={() => setOpen(true)}
            aria-label={hidden ? `Фильтры, включено ${hidden}` : 'Фильтры'}
          >
            <SlidersHorizontalIcon className='size-5' />
            {hidden > 0 && (
              <span className='bg-primary text-primary-foreground border-foreground absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center border-[1.5px] text-[11px] font-bold'>
                {hidden}
              </span>
            )}
          </Button>
        )}
      </div>
      {quick && chips(quick)}

      {withSheet && (
        <Sheet
          open={open}
          onOpenChange={setOpen}
        >
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Фильтры</SheetTitle>
            </SheetHeader>
            <div className='px-gutter flex flex-col gap-5 pt-2'>
              {more}
              {groups.map(g => (
                <div
                  key={g.id}
                  className='flex flex-col gap-1.5'
                >
                  <Eyebrow as='p'>{g.name}</Eyebrow>
                  {chips(g)}
                </div>
              ))}
            </div>
            <div className='px-gutter grid grid-cols-2 gap-2 pt-6 pb-6'>
              {onReset ? (
                <Button
                  type='button'
                  variant='outline'
                  onClick={onReset}
                >
                  Сбросить
                </Button>
              ) : (
                <span />
              )}
              <Button
                type='button'
                onClick={() => setOpen(false)}
              >
                {showLabel}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
