import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';

import type { CatalogKind } from '@sportbot/api/entities/catalog';
import { routeHref, ROUTES } from '@/shared/config/routes';
import { Screen } from '@/shared/ui/kit/Screen';
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { CatalogBrowser } from '@/widgets/catalog/CatalogBrowser';
import { EMPTY_CATALOG_FILTER, type CatalogFilterState } from '@/widgets/catalog/catalog-filter';
import { ExerciseCreateSheet } from '@/widgets/catalog/ExerciseCreateSheet';
import { NewEntryLinks } from '@/widgets/catalog/NewEntryLinks';
import { StretchCreateSheet } from '@/widgets/catalog/StretchCreateSheet';

import { MineButton } from './components/MineButton';

type Tab = 'exercises' | 'stretches';

const TABS = [
  { value: 'exercises' as const, label: 'Упражнения' },
  { value: 'stretches' as const, label: 'Растяжки' },
] as const;

// Справочник (frontend-tz, 11): упражнения и растяжки с поиском и фильтрами.
// «Мои» — кнопкой в шапке на отдельный экран: это не раздел справочника, а свои записи
const LibraryPage = () => {
  const [tab, setTab] = useState<Tab>('exercises');
  const [filter, setFilter] = useState<CatalogFilterState>(EMPTY_CATALOG_FILTER);
  // Какую запись создаём: шторки живут здесь, а не в кнопках — кнопки из пустого состояния пропадают с первой записью
  const [creating, setCreating] = useState<CatalogKind | null>(null);

  return (
    <Screen
      header={
        <>
          <ScreenHeader
            title="Справочник"
            action={<MineButton onPress={() => router.push(routeHref(ROUTES.LIBRARY_MINE))} />}
          />
          <View className="px-gutter gap-3 pt-4">
            <Segmented options={TABS} value={tab} onValueChange={setTab} stretch />
          </View>
        </>
      }
      className="gap-5 pt-4"
    >
      <CatalogBrowser
        kind={tab === 'exercises' ? 'exercise' : 'stretch'}
        filter={filter}
        onFilterChange={(patch) => setFilter((prev) => ({ ...prev, ...patch }))}
        onOpen={(id) =>
          router.push(
            tab === 'exercises'
              ? routeHref(ROUTES.EXERCISE, { exerciseId: id })
              : routeHref(ROUTES.STRETCH, { stretchId: id }),
          )
        }
        emptyAction={<NewEntryLinks onCreate={setCreating} size="default" />}
      />
      <ExerciseCreateSheet open={creating === 'exercise'} onOpenChange={(open) => !open && setCreating(null)} />
      <StretchCreateSheet open={creating === 'stretch'} onOpenChange={(open) => !open && setCreating(null)} />
    </Screen>
  );
};

export default LibraryPage;
