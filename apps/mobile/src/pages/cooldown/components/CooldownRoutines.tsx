import { pluralize } from '@front-cmdt/utils/pluralize';

import { toAssetUrl } from '@/shared/api';
import { STRETCH_FORMS } from '@/shared/lib/plural-forms';
import { useStretchRoutines } from '@/shared/local/entities/stretch-routine';
import { List } from '@/shared/ui/kit/ListRow';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Eyebrow } from '@/shared/ui/kit/Typography';
import { CatalogRow } from '@/widgets/catalog/CatalogRow';

import type { CooldownFlow } from '../model/use-cooldown-flow';

// Готовый комплекс вместо подобранного набора. Нет комплексов или не загрузились — блока нет, заминка от него не зависит
export const CooldownRoutines = ({ flow }: { flow: CooldownFlow }) => {
  const { data: routines } = useStretchRoutines();
  if (!routines?.length) return null;

  return (
    <ScreenSection>
      {/* Без подписи комплексы сливаются со списком растяжек выше */}
      <Eyebrow tone="primary">Или готовый комплекс</Eyebrow>
      <List>
        {routines.map((routine) => (
          <CatalogRow
            key={routine.id}
            name={routine.name}
            imageUrl={toAssetUrl(routine.stretches[0]?.imageUrl) ?? null}
            meta={`~${routine.minutes} мин · ${pluralize(routine.stretches.length, STRETCH_FORMS)}`}
            onPress={() => flow.pickRoutine(routine.id)}
          />
        ))}
      </List>
    </ScreenSection>
  );
};
