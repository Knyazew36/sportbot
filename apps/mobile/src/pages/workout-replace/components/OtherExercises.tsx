import { Repeat } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { EQUIPMENT_LABEL } from '@sportbot/api/entities/catalog';
import { toAssetUrl } from '@/shared/api';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { CatalogBrowser } from '@/widgets/catalog/CatalogBrowser';
import { CatalogRow } from '@/widgets/catalog/CatalogRow';
import { type CatalogFilterState, EMPTY_CATALOG_FILTER } from '@/widgets/catalog/catalog-filter';

import type { ReplaceChoice } from '../model/use-replace-flow';

type OtherExercisesProps = {
  /** Упражнения, которые уже стоят в тренировке: помечены, заменить на них нельзя */
  presentIds: number[];
  onPreview: (exercise: ReplaceChoice) => void;
  onChoose: (exercise: ReplaceChoice) => void;
};

// Любое упражнение справочника через поиск и фильтры — когда среди аналогов нужного нет
export const OtherExercises = ({ presentIds, onPreview, onChoose }: OtherExercisesProps) => {
  const [filter, setFilter] = useState<CatalogFilterState>(EMPTY_CATALOG_FILTER);

  return (
    <View className="-mx-gutter gap-4">
      <CatalogBrowser
        kind="exercise"
        filter={filter}
        onFilterChange={(patch) => setFilter((prev) => ({ ...prev, ...patch }))}
        renderItem={(e) => {
          const present = presentIds.includes(e.id);
          return (
            <CatalogRow
              key={e.id}
              name={e.name}
              imageUrl={toAssetUrl(e.imageUrl) ?? null}
              meta={[e.muscles, e.equipment && EQUIPMENT_LABEL[e.equipment], present && 'уже в тренировке']
                .filter(Boolean)
                .join(' · ')}
              draft={e.draft}
              onPress={() => onPreview(e)}
              trail={
                present ? undefined : (
                  <Button
                    variant="outline"
                    size="icon-sm"
                    accessibilityLabel={`Заменить на «${e.name}»`}
                    onPress={() => onChoose(e)}
                  >
                    <Icon as={Repeat} className="size-4" />
                  </Button>
                )
              }
            />
          );
        }}
      />
    </View>
  );
};
