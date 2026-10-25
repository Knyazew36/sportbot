import { useState } from 'react';
import { View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';

import { Icon } from './Icon';
import { OptionButton } from './OptionButton';
import { Sheet } from './Sheet';
import { Text } from './Typography';
import { Pressable } from './Pressable';

type Option = { value: string; label: string };

type SheetSelectFieldProps = {
  options: readonly Option[];
  value: string;
  onValueChange: (value: string) => void;
  /** Заголовок шторки и подпись для скринридера */
  title: string;
  placeholder?: string;
  className?: string;
};

// Длинный выбор (город для часового пояса) — порт shared/ui/kit/SheetSelectField.tsx:
// список всегда в шторке снизу и прокручивается внутри неё
export const SheetSelectField = ({
  options,
  value,
  onValueChange,
  title,
  placeholder = 'Выбрать',
  className,
}: SheetSelectFieldProps) => {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={() => {
          haptic.tap();
          setOpen(true);
        }}
        className={cn(
          'border-input bg-background h-12 w-full flex-row items-center justify-between gap-1.5 border-[1.5px] px-3.5 py-2',
          open && 'border-primary',
          className,
        )}
      >
        <Text size="lg" numberOfLines={1} tone={current ? 'inherit' : 'muted'} className="min-w-0 flex-1">
          {current?.label ?? placeholder}
        </Text>
        <Icon as={ChevronDown} className="text-muted-foreground size-4 shrink-0" />
      </Pressable>
      <Sheet open={open} onOpenChange={setOpen} title={title}>
        <View className="gap-2 pb-2">
          {options.map((o) => (
            <OptionButton
              key={o.value}
              title={o.label}
              selected={o.value === value}
              onPress={() => {
                onValueChange(o.value);
                setOpen(false);
              }}
            />
          ))}
        </View>
      </Sheet>
    </>
  );
};
