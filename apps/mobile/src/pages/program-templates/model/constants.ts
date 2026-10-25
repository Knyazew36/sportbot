import type { CatalogScope } from '@sportbot/api/entities/program';

import type { CatalogSort } from './use-catalog-filter';

export const SCOPE_OPTIONS: { value: CatalogScope; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'templates', label: 'Каталог' },
  { value: 'users', label: 'Пользователей' },
];

export const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'default', label: 'Рекомендуем' },
  { value: 'popular', label: 'Популярные' },
];

/** Мест в рейтинге */
export const CHART = 5;
/** Меньше — это не рейтинг, а пара случайных добавлений: плашку не показываем */
export const CHART_MIN = 3;
/** Программ в ленте «От сообщества»: дальше — весь список пользователей фильтром */
export const COMMUNITY = 10;
