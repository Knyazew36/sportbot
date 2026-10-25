import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

import { QueryState } from './QueryState';
import { Screen } from './Screen';

type QueryScreenProps<T> = {
  query: UseQueryResult<T>;
  fullscreen?: boolean;
  children: (data: T) => ReactNode;
};

// Экран-обёртка над QueryState: загрузка/ошибка — на своём Screen, данные — как есть.
// Страница с данными рисует свой Screen (шапка, футер); второй каркас вокруг неё удвоил бы
// отступы от выреза и жестовой полосы — экран сжимался бы не на всю высоту
export const QueryScreen = <T,>({ query, fullscreen, children }: QueryScreenProps<T>) => {
  if (query.isSuccess) return children(query.data);

  return (
    <Screen fullscreen={fullscreen} scroll={false}>
      <QueryState query={query}>{children}</QueryState>
    </Screen>
  );
};
