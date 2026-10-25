import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { getApiErrorMessage, getApiErrorStatus } from '@/shared/api';

import { Button } from './Button';
import { StateView } from './StateView';

type QueryStateProps<T> = {
  query: UseQueryResult<T>;
  /** Данные есть, но показывать нечего (пустой список) */
  isEmpty?: (data: T) => boolean;
  empty?: { title?: string; description?: ReactNode; action?: ReactNode };
  children: (data: T) => ReactNode;
};

// Единая развилка состояний запроса: загрузка, нет прав (403), ошибка с повтором, пусто, данные.
// Страница описывает только успешный случай — порт shared/ui/kit/QueryState.tsx
export const QueryState = <T,>({ query, isEmpty, empty, children }: QueryStateProps<T>) => {
  if (query.isPending) return <StateView state="loading" />;

  if (query.isError) {
    if (getApiErrorStatus(query.error) === 403) return <StateView state="denied" />;

    return (
      <StateView
        state="error"
        error={{
          title: 'Не удалось загрузить',
          description: getApiErrorMessage(query.error),
          action: (
            <Button variant="outline" onPress={() => void query.refetch()}>
              Повторить
            </Button>
          ),
        }}
      />
    );
  }

  if (isEmpty?.(query.data))
    return (
      <StateView
        state="empty"
        empty={empty}
      />
    );

  return children(query.data);
};
