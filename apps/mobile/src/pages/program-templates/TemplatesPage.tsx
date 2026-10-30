import { pluralize } from '@front-cmdt/utils/pluralize';
import { RotateCcw } from 'lucide-react-native';

import { PROGRAM_FORMS } from '@/shared/lib/plural-forms';
import { Button } from '@/shared/ui/kit/Button';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { TemplateFilter } from '@/widgets/template-filter/TemplateFilter';

import { BlankProgramButton } from '@/features/create-program/BlankProgramButton';
import { CatalogMoreFilters } from './components/CatalogMoreFilters';
import { CatalogResults } from './components/CatalogResults';
import { CatalogShowcase } from './components/CatalogShowcase';
import { useCatalogFilter } from './model/use-catalog-filter';

// Каталог программ (frontend-tz, 10.2): шаблоны и программы пользователей одной витриной.
// Без фильтров — полки «Популярное» и «От сообщества» над общим списком; с фильтром — один список результатов
const TemplatesPage = () => {
  const filter = useCatalogFilter();
  const { catalog, merged, filtered } = filter;

  return (
    <Screen
      fullscreen
      header={<TopBar title="Каталог" subtitle={catalog.data ? pluralize(merged.length, PROGRAM_FORMS) : undefined} />}
      className="gap-8 pt-4"
    >
      <Rise className="px-gutter">
        <TemplateFilter
          groups={filter.groups}
          selection={filter.selection}
          onSelectionChange={filter.select}
          search={filter.query}
          onSearchChange={filter.setQuery}
          moreActive={filter.moreActive}
          onReset={filtered ? filter.reset : undefined}
          // Только число: «Показать 3 программы» рядом со «Сбросить» не влезает в 375px
          showLabel={catalog.data ? `Показать · ${merged.length}` : 'Показать'}
          more={<CatalogMoreFilters filter={filter} />}
        />
      </Rise>
      <QueryState
        query={catalog}
        isEmpty={(data) => data.templates.length + data.users.length === 0}
        empty={
          filtered
            ? {
                title: 'Ничего не нашлось',
                description: 'Сбрось фильтры или собери программу сам.',
                action: (
                  <>
                    <Button variant="outline" icon={RotateCcw} onPress={filter.reset}>
                      Сбросить фильтры
                    </Button>
                    <BlankProgramButton />
                  </>
                ),
              }
            : { title: 'Каталог пока пуст', description: 'Собери программу с нуля.', action: <BlankProgramButton /> }
        }
      >
        {(data) =>
          filtered ? (
            <CatalogResults list={filter.list} sort={filter.sort} />
          ) : (
            <CatalogShowcase
              data={data}
              onShowCommunity={() => filter.setScope('users')}
              onShowPopular={() => filter.setSort('popular')}
            />
          )
        }
      </QueryState>
    </Screen>
  );
};

export default TemplatesPage;
