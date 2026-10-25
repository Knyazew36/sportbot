import { RepeatIcon } from 'lucide-react'

import type { WorkoutAnalog } from '@sportbot/api/entities/workout'
import { toAssetUrl } from '@/shared/api'
import { List } from '@/shared/ui/kit/ListRow'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

type AnalogListProps = {
  list: WorkoutAnalog[]
  onPreview: (analog: WorkoutAnalog) => void
  onChoose: (analog: WorkoutAnalog) => void
}

// Тап по строке — посмотреть упражнение; кнопка справа — сразу к выбору замены
export const AnalogList = ({ list, onPreview, onChoose }: AnalogListProps) => (
  <List>
    {list.map(analog => (
      <CatalogRow
        key={analog.id}
        name={analog.name}
        imageUrl={toAssetUrl(analog.imageUrl) ?? null}
        meta={analog.muscles}
        draft={analog.draft}
        onClick={() => onPreview(analog)}
        trail={
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => onChoose(analog)}
            aria-label={`Заменить на «${analog.name}»`}
          >
            <RepeatIcon />
          </Button>
        }
      />
    ))}
  </List>
)
