import { PlusIcon } from 'lucide-react'
import { useState } from 'react'

import type { CatalogKind } from '@sportbot/api/entities/catalog'
import { OptionButton } from '@/shared/ui/kit/OptionButton'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

type NewEntryButtonProps = {
  onCreate: (kind: CatalogKind) => void
}

// «Мои записи»: одна кнопка «Добавить», что создать — выбираем в шторке
export const NewEntryButton = ({ onCreate }: NewEntryButtonProps) => {
  const [choosing, setChoosing] = useState(false)

  const pick = (kind: CatalogKind) => {
    setChoosing(false)
    onCreate(kind)
  }

  return (
    <>
      <Button
        variant='outline'
        size='lg'
        className='w-full'
        onClick={() => setChoosing(true)}
      >
        <PlusIcon strokeWidth={2.5} />
        Добавить
      </Button>
      <Sheet
        open={choosing}
        onOpenChange={setChoosing}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Что добавить?</SheetTitle>
          </SheetHeader>
          <div className='flex flex-col gap-2'>
            <OptionButton
              title='Упражнение'
              onClick={() => pick('exercise')}
            />
            <OptionButton
              title='Растяжку'
              onClick={() => pick('stretch')}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
