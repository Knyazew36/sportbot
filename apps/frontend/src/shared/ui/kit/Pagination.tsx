import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import type { PaginationMeta } from '@/shared/api'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type PaginationProps = {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  className?: string
}

// Переключатель страниц под meta серверного списка. На единственной странице не рисуется
export const Pagination = ({ meta, onPageChange, className }: PaginationProps) => {
  if (meta.totalPages <= 1) return null

  return (
    <nav
      aria-label='Страницы'
      className={cn('flex items-center justify-between gap-4', className)}
    >
      <span className='mono-label text-smoke'>
        Стр. {meta.page} из {meta.totalPages}
        {meta.total != null && ` · всего ${meta.total}`}
      </span>
      <div className='flex gap-2'>
        <Button
          variant='secondary'
          size='icon-sm'
          aria-label='Предыдущая страница'
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant='secondary'
          size='icon-sm'
          aria-label='Следующая страница'
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  )
}
