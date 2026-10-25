import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

import { QueryState } from './QueryState';
import { Screen } from './Screen';

type QueryScreenProps<T> = {
  query: UseQueryResult<T>;
  fullscreen?: boolean;
  children: (data: T) => ReactNode;
};

// Экран-обёртка над QueryState: загрузка/ошибка на полноэкранном Screen, данные — дети
export const QueryScreen = <T,>({ query, fullscreen, children }: QueryScreenProps<T>) => (
  <Screen fullscreen={fullscreen} scroll={false}>
    <QueryState query={query}>{children}</QueryState>
  </Screen>
);
