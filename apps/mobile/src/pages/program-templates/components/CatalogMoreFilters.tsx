import { View } from 'react-native';

import { Segmented } from '@/shared/ui/kit/Segmented';
import { Eyebrow } from '@/shared/ui/kit/Typography';

import { SCOPE_OPTIONS, SORT_OPTIONS } from '../model/constants';
import type { CatalogFilter } from '../model/use-catalog-filter';

// «Ещё» в фильтре каталога: чьи программы и порядок
export const CatalogMoreFilters = ({ filter }: { filter: CatalogFilter }) => (
  <>
    <View className="gap-1.5">
      <Eyebrow>Чьи</Eyebrow>
      <Segmented options={SCOPE_OPTIONS} value={filter.scope} onValueChange={filter.setScope} stretch />
    </View>
    <View className="gap-1.5">
      <Eyebrow>Сначала</Eyebrow>
      <Segmented options={SORT_OPTIONS} value={filter.sort} onValueChange={filter.setSort} stretch />
    </View>
  </>
);
