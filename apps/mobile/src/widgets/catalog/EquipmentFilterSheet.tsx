import { View } from 'react-native';

import { type Equipment, EQUIPMENT_LABEL } from '@sportbot/api/entities/catalog';
import { OptionButton } from '@/shared/ui/kit/OptionButton';
import { Sheet } from '@/shared/ui/kit/Sheet';

import { EQUIPMENT_OPTIONS } from './equipment-options';

type EquipmentFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: Equipment | 'ALL';
  onValueChange: (equipment: Equipment | 'ALL') => void;
};

// Выбор инвентаря — порт widgets/catalog/EquipmentFilterSheet.tsx: один вариант, тап сразу применяет и закрывает
export const EquipmentFilterSheet = ({ open, onOpenChange, value, onValueChange }: EquipmentFilterSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange} title="С чем занимаешься?">
    <View className="gap-2 pt-1">
      {EQUIPMENT_OPTIONS.map((o) => (
        <OptionButton
          key={o.value}
          title={o.value === 'ALL' ? 'Любой' : EQUIPMENT_LABEL[o.value]}
          meta={o.meta}
          selected={value === o.value}
          onPress={() => {
            onValueChange(o.value);
            onOpenChange(false);
          }}
        />
      ))}
    </View>
  </Sheet>
);
