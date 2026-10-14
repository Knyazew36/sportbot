import { Link } from 'react-router'

import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { CatalogImage } from '@/shared/ui/kit/CatalogImage'
import { ListRow } from '@/shared/ui/kit/ListRow'
import { Badge } from '@/shared/ui/shadcn/badge'

type CatalogRowProps = {
  name: string
  imageUrl: string | null
  meta: ReactNode
  /** Личный черновик — «не проверено» (frontend-tz, 11.1) */
  draft?: boolean
  /** Карточка записи; без ссылки строка просто показывает запись */
  to?: string
  trail?: ReactNode
  /** Выбранная строка в множественном выборе */
  selected?: boolean
  children?: ReactNode
}

// Строка справочника: миниатюра, название, мышцы. Общая для справочника, подбора в комплекс и админки
export const CatalogRow = ({ name, imageUrl, meta, draft, to, trail, selected, children }: CatalogRowProps) => (
  <ListRow
    lead={
      <CatalogImage
        src={imageUrl}
        alt=''
      />
    }
    title={
      to ? (
        <Link
          to={to}
          className='underline-offset-4 after:absolute after:inset-0 hover:underline'
        >
          {name}
        </Link>
      ) : (
        name
      )
    }
    meta={meta}
    // Ссылка растянута на всю строку, поэтому действия справа поднимаем над ней
    trail={trail && <div className='relative z-10'>{trail}</div>}
    className={cn('relative -mx-gutter px-gutter transition-colors', selected && 'bg-accent', to && 'hover:bg-accent/60')}
  >
    {draft && (
      <Badge
        variant='outline'
        className='mt-2'
      >
        не проверено
      </Badge>
    )}
    {children}
  </ListRow>
)
