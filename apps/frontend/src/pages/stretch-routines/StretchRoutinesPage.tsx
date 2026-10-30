import { pluralize } from '@front-cmdt/utils/pluralize'

import { useStretchRoutines } from '@sportbot/api/entities/stretch-routine'
import { toAssetUrl } from '@/shared/api'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { List } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

// Готовые комплексы: отдельное занятие растяжкой, без тренировки
const StretchRoutinesPage = () => {
  const routines = useStretchRoutines()
  return (
    <QueryScreen query={routines}>
      {data => (
        <Screen
          header={
            <TopBar
              back={`${ROUTES.LIBRARY}?tab=stretches`}
              title='Комплексы растяжек'
            />
          }
          className='px-gutter pt-4'
        >
          <List>
            {data.map(routine => (
              <CatalogRow
                key={routine.id}
                name={routine.name}
                imageUrl={toAssetUrl(routine.stretches[0]?.imageUrl) ?? null}
                meta={`~${routine.minutes} мин · ${pluralize(routine.stretches.length, ['растяжка', 'растяжки', 'растяжек'])}`}
                to={buildPath(ROUTES.STRETCH_ROUTINE, { routineId: routine.id })}
              />
            ))}
          </List>
        </Screen>
      )}
    </QueryScreen>
  )
}

export default StretchRoutinesPage
