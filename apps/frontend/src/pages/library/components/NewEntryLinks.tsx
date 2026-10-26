import { PlusIcon } from 'lucide-react'

import type { CatalogKind } from '@sportbot/api/entities/catalog'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type NewEntryLinksProps = {
  /** Шторки создания живут на странице справочника: кнопки бывают в пустом состоянии, которое исчезает с первой записью */
  onCreate: (kind: CatalogKind) => void
  /** В подвале — крупные, в пустом состоянии — как соседняя «Сбросить фильтры» */
  size?: 'default' | 'lg'
  className?: string
}

// Нет нужного в справочнике — своя запись (frontend-tz, 11.4). Две кнопки в одну строку
export const NewEntryLinks = ({ onCreate, size = 'lg', className }: NewEntryLinksProps) => (
  <div className={cn('grid w-full grid-cols-2 gap-2', className)}>
    <Button
      variant='outline'
      size={size}
      onClick={() => onCreate('exercise')}
    >
      <PlusIcon strokeWidth={2.5} />
      Упражнение
    </Button>
    <Button
      variant='outline'
      size={size}
      onClick={() => onCreate('stretch')}
    >
      <PlusIcon strokeWidth={2.5} />
      Растяжку
    </Button>
  </div>
)
