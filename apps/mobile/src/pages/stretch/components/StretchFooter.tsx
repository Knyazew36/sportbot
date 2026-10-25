import { View } from 'react-native';
import { Ban, Check, PencilLine, Play, RotateCcw, SkipForward } from 'lucide-react-native';

import type { CatalogStretch } from '@sportbot/api/entities/catalog';
import { useCreateStretchExclusion, useIsStretchExcluded } from '@sportbot/api/entities/stretch-exclusion';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { HoldControls } from '@/widgets/catalog/HoldControls';

type StretchFooterProps = {
  stretch: CatalogStretch;
  /** 0 — таймер не запущен, 1 и 2 — сторона */
  side: 0 | 1 | 2;
  onSide: (side: 0 | 1 | 2) => void;
  onEdit: () => void;
};

// «Попробовать» запускает таймер удержания, как в заминке; до запуска — правка и «не предлагать»
export const StretchFooter = ({ stretch: s, side, onSide, onEdit }: StretchFooterProps) => {
  const excluded = useIsStretchExcluded(s.id);
  const exclude = useCreateStretchExclusion();

  if (side !== 0)
    return (
      <HoldControls
        key={side}
        holdSeconds={s.holdSeconds}
        side={s.perSide ? side : undefined}
        autoStart
        back={{ label: 'Сбросить', icon: RotateCcw, onPress: () => onSide(0) }}
        next={
          s.perSide && side === 1
            ? { label: 'Левая', icon: SkipForward, onPress: () => onSide(2) }
            : { label: 'Готово', icon: Check, onPress: () => onSide(0) }
        }
      />
    );

  return (
    <View className="border-border bg-background px-gutter flex-row items-center gap-2 border-t-[1.5px] pt-3 pb-4">
      <Button variant="outline" size="icon-lg" accessibilityLabel="Предложить правку" onPress={onEdit}>
        <Icon as={PencilLine} className="size-6" />
      </Button>
      {/* Исключённую возвращают из строки под названием — тут кнопка только «убрать» */}
      {!excluded && (
        <Button
          variant="outline"
          size="icon-lg"
          loading={exclude.isPending}
          onPress={() => exclude.mutate(s.id)}
          accessibilityLabel="Не предлагать в заминке"
        >
          <Icon as={Ban} className="size-6" />
        </Button>
      )}
      <Button size="lg" icon={Play} className="flex-1" onPress={() => onSide(1)}>
        Попробовать
      </Button>
    </View>
  );
};
