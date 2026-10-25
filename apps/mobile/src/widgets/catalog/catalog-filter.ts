import type { Equipment } from '@sportbot/api/entities/catalog';

export type CatalogFilterState = {
  query: string;
  /** Мышцы — коды: шторка и карта тела работают с ними, API ждёт id */
  muscleCodes: string[];
  /** Только у упражнений */
  equipment: Equipment | 'ALL';
};

export const EMPTY_CATALOG_FILTER: CatalogFilterState = { query: '', muscleCodes: [], equipment: 'ALL' };
