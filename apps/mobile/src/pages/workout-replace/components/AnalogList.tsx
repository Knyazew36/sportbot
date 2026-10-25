import { Repeat } from 'lucide-react-native';

import type { WorkoutAnalog } from '@sportbot/api/entities/workout';
import { toAssetUrl } from '@/shared/api';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { List } from '@/shared/ui/kit/ListRow';
import { CatalogRow } from '@/widgets/catalog/CatalogRow';

type AnalogListProps = {
  list: WorkoutAnalog[];
  onPreview: (analog: WorkoutAnalog) => void;
  onChoose: (analog: WorkoutAnalog) => void;
};

// Тап по строке — посмотреть упражнение; кнопка справа — сразу к выбору замены
export const AnalogList = ({ list, onPreview, onChoose }: AnalogListProps) => (
  <List>
    {list.map((analog) => (
      <CatalogRow
        key={analog.id}
        name={analog.name}
        imageUrl={toAssetUrl(analog.imageUrl) ?? null}
        meta={analog.muscles}
        draft={analog.draft}
        onPress={() => onPreview(analog)}
        trail={
          <Button
            variant="outline"
            size="icon-sm"
            accessibilityLabel={`Заменить на «${analog.name}»`}
            onPress={() => onChoose(analog)}
          >
            <Icon as={Repeat} className="size-4" />
          </Button>
        }
      />
    ))}
  </List>
);
