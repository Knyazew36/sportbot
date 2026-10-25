import { View } from 'react-native';

import type { CooldownStretch } from '@sportbot/api/entities/workout';
import { toAssetUrl } from '@/shared/api';
import { Button } from '@/shared/ui/kit/Button';
import { CatalogImage } from '@/shared/ui/kit/CatalogImage';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Eyebrow } from '@/shared/ui/kit/Typography';

type StretchListSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  main: CooldownStretch[];
  optional: CooldownStretch[];
  minutes: number;
  current: number | null;
  onPick: (index: number) => void;
  /** Тап по строке — карточка растяжки поверх списка */
  onOpen: (stretch: CooldownStretch) => void;
};

// Вся заминка разом: из любого места можно перейти к любой растяжке
export const StretchListSheet = ({
  open,
  onOpenChange,
  main,
  optional,
  minutes,
  current,
  onPick,
  onOpen,
}: StretchListSheetProps) => {
  const blocks = [
    { title: 'Основной блок', list: main, offset: 0 },
    { title: 'Если есть время', list: optional, offset: main.length },
  ].filter((b) => b.list.length);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Вся заминка" kicker={`~${minutes} мин`}>
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
                  <ListRow
                    key={s.id}
                    lead={<CatalogImage src={toAssetUrl(s.imageUrl) ?? null} alt={s.name} />}
                    title={s.name}
                    meta={`${s.muscles} · ${s.holdSeconds} с${s.perSide ? ' × 2' : ''}`}
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
                        {index === current ? 'Сейчас' : 'Перейти'}
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
