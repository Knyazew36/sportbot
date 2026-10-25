import { useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Search, X } from 'lucide-react-native';

import { cn } from '@/shared/lib/utils';

import { Icon } from './Icon';
import { Input, type InputRef } from './Input';

type SearchFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
};

// Поиск по названию — порт shared/ui/kit/SearchField.tsx: лупа слева, крестик очистки справа.
// Нижнее меню прячет сама система, когда открыта клавиатура (tabBarHideOnKeyboard), поэтому фокус наружу не нужен
export const SearchField = ({
  value,
  onValueChange,
  placeholder = 'Название',
  onFocus,
  onBlur,
  className,
}: SearchFieldProps) => {
  const ref = useRef<InputRef>(null);

  return (
    <View className={cn('justify-center', className)}>
      <Input
        ref={ref}
        value={value}
        onChangeText={onValueChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        autoCorrect={false}
        className="px-10"
      />
      <View pointerEvents="none" className="absolute left-3.5">
        <Icon as={Search} className="text-muted-foreground size-4" />
      </View>
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Очистить поиск"
          onPress={() => {
            onValueChange('');
            ref.current?.focus();
          }}
          className="absolute right-1.5 size-9 items-center justify-center"
        >
          <Icon as={X} className="text-muted-foreground size-4" />
        </Pressable>
      ) : null}
    </View>
  );
};
