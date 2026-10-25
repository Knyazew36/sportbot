import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';

import { type Equipment, EQUIPMENT_LABEL } from '@sportbot/api/entities/catalog';
import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { Icon } from '@/shared/ui/kit/Icon';
import { SearchField } from '@/shared/ui/kit/SearchField';
import { Text } from '@/shared/ui/kit/Typography';

import { musclesLabel } from './catalog-labels';
import { EquipmentFilterSheet } from './EquipmentFilterSheet';
import { MuscleFilterSheet } from './MuscleFilterSheet';

type ChipProps = { label: string; active: boolean; onPress: () => void };

// Чипы делят строку поровну: длинная подпись («Передние дельты») режется многоточием, а не выталкивает соседей
const Chip = ({ label, active, onPress }: ChipProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    onPress={() => {
      haptic.tap();
      onPress();
    }}
    className={cn(
      'border-foreground h-9 min-w-0 flex-1 flex-row items-center justify-between gap-1 rounded-full border-[1.5px] px-3.5',
      active ? 'bg-foreground' : 'bg-card active:bg-mist',
    )}
  >
    <Text size="sm" medium numberOfLines={1} className={cn('shrink', active ? 'text-background' : 'text-foreground')}>
      {label}
    </Text>
    <Icon as={ChevronDown} className={cn('size-4', active ? 'text-background' : 'text-foreground')} />
  </Pressable>
);

type CatalogFilterBarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  muscles: readonly { code: string; name: string }[];
  /** Выбранные мышцы — коды */
  muscleCodes: readonly string[];
  onMuscleCodesChange: (codes: string[]) => void;
  /** Фильтр инвентаря есть только у упражнений — у растяжек его не передаём */
  equipment?: Equipment | 'ALL';
  onEquipmentChange?: (equipment: Equipment | 'ALL') => void;
  /** Крестик: снять мышцы и инвентарь одним изменением */
  onReset: () => void;
  placeholder?: string;
  /** Подпись кнопки шторки мышц по черновику: «Показать 42 упражнения» */
  showLabel?: (codes: string[]) => string;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
};

// Поиск и одна строка чипов над справочником — порт widgets/catalog/CatalogFilterBar.tsx.
// Каждый чип открывает свою шторку: мышцы — с картой тела, инвентарь — с подсказками
export const CatalogFilterBar = ({
  query,
  onQueryChange,
  muscles,
  muscleCodes,
  onMuscleCodesChange,
  equipment,
  onEquipmentChange,
  onReset,
  placeholder = 'Название упражнения',
  showLabel,
  onSearchFocus,
  onSearchBlur,
}: CatalogFilterBarProps) => {
  const [opened, setOpened] = useState<'muscles' | 'equipment' | null>(null);
  const names = Object.fromEntries(muscles.map((m) => [m.code, m.name]));
  const withEquipment = equipment !== undefined && onEquipmentChange;
  const active = muscleCodes.length > 0 || (withEquipment && equipment !== 'ALL');
  const close = (open: boolean) => !open && setOpened(null);

  return (
    <View className="gap-2.5">
      <SearchField
        value={query}
        onValueChange={onQueryChange}
        placeholder={placeholder}
        onFocus={onSearchFocus}
        onBlur={onSearchBlur}
      />
      <View className="flex-row gap-2">
        <Chip
          label={musclesLabel(muscleCodes, names)}
          active={muscleCodes.length > 0}
          onPress={() => setOpened('muscles')}
        />
        {withEquipment && (
          <Chip
            label={equipment === 'ALL' ? 'Инвентарь' : EQUIPMENT_LABEL[equipment]}
            active={equipment !== 'ALL'}
            onPress={() => setOpened('equipment')}
          />
        )}
        {/* Сброс — кругом с крестиком: со словом «Сбросить» строка не влезает в узкий экран */}
        {active && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Сбросить фильтры"
            onPress={() => {
              haptic.tap();
              onReset();
            }}
            className="border-foreground bg-background active:bg-mist size-9 items-center justify-center rounded-full border-[1.5px]"
          >
            <Icon as={X} className="text-foreground size-4" />
          </Pressable>
        )}
      </View>

      <MuscleFilterSheet
        open={opened === 'muscles'}
        onOpenChange={close}
        muscles={muscles}
        value={muscleCodes}
        onApply={onMuscleCodesChange}
        showLabel={showLabel}
      />
      {withEquipment && (
        <EquipmentFilterSheet
          open={opened === 'equipment'}
          onOpenChange={close}
          value={equipment}
          onValueChange={onEquipmentChange}
        />
      )}
    </View>
  );
};
