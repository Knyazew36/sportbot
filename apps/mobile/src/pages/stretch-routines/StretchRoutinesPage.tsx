import { router } from 'expo-router';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { toAssetUrl } from '@/shared/api';
import { routeHref, ROUTES } from '@/shared/config/routes';
import { STRETCH_FORMS } from '@/shared/lib/plural-forms';
import { useStretchRoutines } from '@/shared/local/entities/stretch-routine';
import { List } from '@/shared/ui/kit/ListRow';
import { QueryScreen } from '@/shared/ui/kit/QueryScreen';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { CatalogRow } from '@/widgets/catalog/CatalogRow';

// Готовые комплексы: отдельное занятие растяжкой, без тренировки
const StretchRoutinesPage = () => {
  const routines = useStretchRoutines();
  return (
    <QueryScreen query={routines} fullscreen>
      {(data) => (
        <Screen fullscreen header={<TopBar back={() => router.back()} title="Комплексы растяжек" />} className="px-gutter pt-4">
          <List>
            {data.map((routine) => (
              <CatalogRow
                key={routine.id}
                name={routine.name}
                imageUrl={toAssetUrl(routine.stretches[0]?.imageUrl) ?? null}
                meta={`~${routine.minutes} мин · ${pluralize(routine.stretches.length, STRETCH_FORMS)}`}
                onPress={() => router.push(routeHref(ROUTES.STRETCH_ROUTINE, { routineId: routine.id }))}
              />
            ))}
          </List>
        </Screen>
      )}
    </QueryScreen>
  );
};

export default StretchRoutinesPage;
