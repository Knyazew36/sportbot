import { CheckIcon } from 'lucide-react'

import { useState } from 'react'

import type { ProgramListItem } from '@sportbot/api/entities/program'
import { WORKOUT_FORMS } from '@/shared/lib/plural-forms'
import { cn } from '@/shared/lib/utils'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { SearchField } from '@/shared/ui/kit/SearchField'
import { Text } from '@/shared/ui/kit/Typography'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { pluralize } from '@front-cmdt/utils/pluralize'

import { SEARCH_FROM, sortTargets } from './sort-targets'

type CopyTargetSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  programs: ProgramListItem[]
  pending: boolean
  onPick: (programId: number) => void
}

// Выбор своей программы, куда скопировать тренировку. Шторка поверх состава: список во всю высоту,
// программ много — появляется поиск
export const CopyTargetSheet = ({ open, onOpenChange, programs, pending, onPick }: CopyTargetSheetProps) => {
  const [search, setSearch] = useState('')
  const shown = sortTargets(programs, search)

  return (
    <Sheet
      open={open}
      onOpenChange={next => {
        onOpenChange(next)
        if (!next) setSearch('')
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Куда скопировать</SheetTitle>
          <SheetDescription>Тренировка встанет в конец очереди программы</SheetDescription>
        </SheetHeader>
        {programs.length >= SEARCH_FROM && (
          <SearchField
            value={search}
            onValueChange={setSearch}
            placeholder='Название программы'
            className='px-gutter pb-3'
          />
        )}
        <div className='px-gutter min-h-0 flex-1 overflow-y-auto pb-6'>
          {shown.length === 0 ? (
            <Text tone='muted'>Ничего не нашлось.</Text>
          ) : (
            <List>
              {shown.map(p => (
                // Вся строка — кнопка выбора
                <ListRow
                  key={p.id}
                  className={cn(
                    'hover:bg-accent/60 relative -mx-gutter px-gutter transition-colors',
                    pending && 'opacity-60',
                  )}
                  title={
                    <button
                      type='button'
                      className='text-left after:absolute after:inset-0'
                      disabled={pending}
                      onClick={() => onPick(p.id)}
                    >
                      {p.name}
                    </button>
                  }
                  meta={pluralize(p.complexCount, WORKOUT_FORMS)}
                  trail={
                    p.active && (
                      <Text
                        as='span'
                        size='xs'
                        tone='primary'
                        className='flex items-center gap-1'
                      >
                        <CheckIcon className='size-3.5' />
                        активная
                      </Text>
                    )
                  }
                />
              ))}
            </List>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
