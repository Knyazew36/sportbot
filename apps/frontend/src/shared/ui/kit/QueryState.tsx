import type { UseQueryResult } from '@tanstack/react-query'

import { getApiErrorMessage, getApiErrorStatus } from '@/shared/api'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { StateView } from './StateView'

type QueryStateProps<T> = {
  query: UseQueryResult<T>
  /** Данные есть, но показывать нечего (пустой список) */
  isEmpty?: (data: T) => boolean
  empty?: { title: string; description: React.ReactNode; action?: React.ReactNode }
  skeleton?: React.ComponentProps<typeof StateView>['skeleton']
  children: (data: T) => React.ReactNode
}

// Единая развилка состояний запроса: загрузка, нет прав (403), ошибка с повтором, пусто, данные.
// Страница описывает только успешный случай
export const QueryState = <T,>({ query, isEmpty, empty, skeleton, children }: QueryStateProps<T>) => {
  if (query.isPending)
    return (
      <StateView
        state='loading'
        skeleton={skeleton}
      />
    )

  if (query.isError) {
    if (getApiErrorStatus(query.error) === 403) return <StateView state='denied' />

    return (
      <StateView
        state='error'
        error={{
          title: 'Не удалось загрузить',
          description: getApiErrorMessage(query.error),
          action: (
            <Button
              variant='secondary'
              onClick={() => query.refetch()}
            >
              Повторить
            </Button>
          ),
        }}
      />
    )
  }

  if (isEmpty?.(query.data))
    return (
      <StateView
        state='empty'
        empty={empty}
      />
    )

  return children(query.data)
}
