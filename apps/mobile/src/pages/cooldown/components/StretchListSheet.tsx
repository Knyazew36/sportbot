import { View } from 'react-native';
import { Plus } from 'lucide-react-native';

import type { CooldownStretch } from '@sportbot/api/entities/workout';
import { toAssetUrl } from '@/shared/api';
import { Button } from '@/shared/ui/kit/Button';
import { List } from '@/shared/ui/kit/ListRow';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Eyebrow } from '@/shared/ui/kit/Typography';
import { CatalogRow } from '@/widgets/catalog/CatalogRow';

type StretchListSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  main: CooldownStretch[];
  optional: CooldownStretch[];
  minutes: number;
  current: number | null;
  done: ReadonlySet<number>;
  onPick: (index: number) => void;
  /** Тап по строке — карточка растяжки поверх списка */
  onOpen: (stretch: CooldownStretch) => void;
  onAdd: () => void;
  onFinish: () => void;
};

// Вся заминка разом: из любого места можно перейти к любой растяжке
export const StretchListSheet = ({
  open,
  onOpenChange,
  main,
  optional,
  minutes,
  current,
  done,
  onPick,
  onOpen,
  onAdd,
  onFinish,
}: StretchListSheetProps) => {
  const blocks = [
    { title: 'Основной блок', list: main, offset: 0 },
    { title: 'Если есть время', list: optional, offset: main.length },
  ].filter((b) => b.list.length);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Вся заминка"
      kicker={`ещё ~${minutes} мин`}
      footer={
        <View className="flex-row flex-wrap justify-end gap-2">
          {/* Заминка не влияет на засчитывание — выйти можно в любой момент без подтверждения */}
          <Button variant="outline" onPress={onFinish}>
            Завершить
          </Button>
          <Button icon={Plus} onPress={onAdd}>
            Добавить
          </Button>
        </View>
      }
    >
      <View className="gap-4 pb-4">
        {blocks.map((block) => (
          <View key={block.title}>
            <Eyebrow className="mb-2">
              {block.title}
            </Eyebrow>
            <List>
              {block.list.map((s, i) => {
                const index = block.offset + i;
                return (
                  <CatalogRow
                    key={s.id}
                    name={s.name}
                    imageUrl={toAssetUrl(s.imageUrl) ?? null}
                    meta={`${s.muscles} · ${s.holdSeconds} с${s.perSide ? ' × 2' : ''}`}
                    selected={index === current}
                    onPress={() => onOpen(s)}
                    trail={
                      <Button
                        variant={index === current ? 'default' : 'outline'}
                        size="xs"
                        onPress={() => {
                          onPick(index);
                          onOpenChange(false);
                        }}
                      >
                        {index === current ? 'Сейчас' : done.has(s.id) ? 'Ещё раз' : 'Перейти'}
                      </Button>
                    }
                  />
                );
              })}
            </List>
          </View>
        ))}
      </View>
    </Sheet>
  );
};
