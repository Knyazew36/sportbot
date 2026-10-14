import type { UseQueryResult } from '@tanstack/react-query'
import { RefreshCwIcon } from 'lucide-react'

import type { ReactNode } from 'react'

import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { ScreenState } from './ScreenState'

type QueryScreenProps<T> = {
  query: Pick<UseQueryResult<T>, 'data' | 'isPending' | 'isError' | 'refetch' | 'isRefetching'>
  /** Пустые данные: показать подсказку вместо children */
  isEmpty?: (data: T) => boolean
  empty?: { title?: string; description?: ReactNode; action?: ReactNode }
  /** Строк-скелетов при загрузке */
  rows?: number
  children: (data: T) => ReactNode
}

// Три состояния любого экрана данных (frontend-tz, раздел 15) в стиле Mini App: загрузка, пусто, ошибка с «Повторить»
export const QueryScreen = <T,>({ query, isEmpty, empty, rows, children }: QueryScreenProps<T>) => {
  if (query.isPending) {
    return (
      <ScreenState
        state='loading'
        rows={rows}
      />
    )
  }

  if (query.isError) {
    return (
      <ScreenState
        state='error'
        action={
          <Button
            variant='outline'
            onClick={() => void query.refetch()}
            disabled={query.isRefetching}
          >
            <RefreshCwIcon className='size-4' />
            Повторить
          </Button>
        }
      />
    )
  }

  const data = query.data as T
  if (isEmpty?.(data)) {
    return (
      <ScreenState
        state='empty'
        title={empty?.title}
        description={empty?.description}
        action={empty?.action}
      />
    )
  }

  return <>{children(data)}</>
}
