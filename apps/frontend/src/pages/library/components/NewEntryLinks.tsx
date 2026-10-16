import { PlusIcon } from 'lucide-react'

import type { CatalogKind } from '@/entities/catalog'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type NewEntryLinksProps = {
  /** Шторки создания живут на странице справочника: кнопки бывают в пустом состоянии, которое исчезает с первой записью */
  onCreate: (kind: CatalogKind) => void
  className?: string
}

// Нет нужного в справочнике — своя запись (frontend-tz, 11.4). Две кнопки в одну строку
export const NewEntryLinks = ({ onCreate, className }: NewEntryLinksProps) => (
  <div className={cn('grid w-full grid-cols-2 gap-2', className)}>
    <Button
      variant='outline'
      size='lg'
      onClick={() => onCreate('exercise')}
    >
      <PlusIcon strokeWidth={2.5} />
      Упражнение
    </Button>
    <Button
      variant='outline'
      size='lg'
      onClick={() => onCreate('stretch')}
    >
      <PlusIcon strokeWidth={2.5} />
      Растяжку
    </Button>
  </div>
)
