import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';

import type { CatalogKind } from '@sportbot/api/entities/catalog';
import { routeHref, ROUTES } from '@/shared/config/routes';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { CatalogBrowser } from '@/widgets/catalog/CatalogBrowser';
import { EMPTY_CATALOG_FILTER, type CatalogFilterState } from '@/widgets/catalog/catalog-filter';
import { ExerciseCreateSheet } from '@/widgets/catalog/ExerciseCreateSheet';
import { StretchCreateSheet } from '@/widgets/catalog/StretchCreateSheet';

import { MineButton } from './components/MineButton';
import { MineTab } from './components/MineTab';
import { NewEntryLinks } from './components/NewEntryLinks';

type Tab = 'exercises' | 'stretches' | 'mine';

const TABS = [
  { value: 'exercises' as const, label: 'Упражнения' },
  { value: 'stretches' as const, label: 'Растяжки' },
] as const;

// Справочник (frontend-tz, 11): упражнения и растяжки с поиском и фильтрами, «Мои» со статусами заявок.
// Две вкладки и блок справочника; «Мои» — кнопкой в шапке: это не раздел справочника, а свои записи
const LibraryPage = () => {
  const [tab, setTab] = useState<Tab>('exercises');
  const [filter, setFilter] = useState<CatalogFilterState>(EMPTY_CATALOG_FILTER);
  // Куда вернуться из «Моих» — на ту вкладку, с которой ушли
  const [lastTab, setLastTab] = useState<Exclude<Tab, 'mine'>>('exercises');
  // Какую запись создаём: шторки живут здесь, а не в кнопках — кнопки из пустого состояния пропадают с первой записью
  const [creating, setCreating] = useState<CatalogKind | null>(null);
  // Липкий низ убираем, пока открыта клавиатура в поиске
  const [searchFocused, setSearchFocused] = useState(false);

  const openTab = (next: Tab) => setTab(next);

  const toggleMine = () => {
    if (tab !== 'mine') setLastTab(tab);
    setTab(tab === 'mine' ? lastTab : 'mine');
  };

  return (
    <Screen
      header={
        <>
          <ScreenHeader
            title={tab === 'mine' ? 'Справочник · мои' : 'Справочник'}
            action={<MineButton active={tab === 'mine'} onPress={toggleMine} />}
          />
          {/* В «Моих» своя вкладка упражнений и растяжек — общая сверху её дублировала бы */}
          {tab !== 'mine' && (
            <View className="px-gutter gap-3 pt-4">
              <Segmented options={TABS} value={tab} onValueChange={(v) => openTab(v)} stretch />
            </View>
          )}
        </>
      }
      footer={
        tab === 'mine' && !searchFocused && (
          <StickyFooter>
            <NewEntryLinks onCreate={setCreating} />
          </StickyFooter>
        )
      }
      className="gap-5 pt-4"
    >
      {tab === 'mine' ? (
        <MineTab />
      ) : (
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
          emptyAction={<NewEntryLinks onCreate={setCreating} />}
          onSearchFocusChange={setSearchFocused}
        />
      )}
      <ExerciseCreateSheet open={creating === 'exercise'} onOpenChange={(open) => !open && setCreating(null)} />
      <StretchCreateSheet open={creating === 'stretch'} onOpenChange={(open) => !open && setCreating(null)} />
    </Screen>
  );
};

export default LibraryPage;
