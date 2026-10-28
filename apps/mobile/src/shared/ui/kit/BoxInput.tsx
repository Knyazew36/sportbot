import { useState } from 'react';
import { View, type TextInputProps } from 'react-native';

import { cn } from '@/shared/lib/utils';

import type { InputRef } from './Input';
import { KitTextInput } from './KitTextInput';
import { Eyebrow } from './Typography';

type BoxInputProps = TextInputProps & {
  label: string;
  className?: string;
  /** Крупная цифра 40px — ввод подхода сразу после него, руки ещё дрожат ([&_input]:text-[40px] фронта) */
  large?: boolean;
  ref?: React.Ref<InputRef>;
};

// Числовое поле с подписью внутри рамки — порт shared/ui/kit/BoxInput.tsx: вес, повторы, вес тела.
// Крупная цифра читается на вытянутой руке. Рамка синеет в фокусе — focus-within фронта
export const BoxInput = ({ label, className, large, onFocus, onBlur, ...props }: BoxInputProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <View
      className={cn(
        'bg-background justify-center border-[1.5px] px-2.5 pt-1 pb-0.5',
        focused ? 'border-primary' : 'border-input',
        className,
      )}
    >
      <Eyebrow size="sm" numberOfLines={1} className="tracking-[0.63px]">
        {label}
      </Eyebrow>
      {/* Число всегда вводится заново: автозаполнение и подсказки клавиатуры только мешают */}
      <KitTextInput
        keyboardType="decimal-pad"
        autoComplete="off"
        autoCorrect={false}
        spellCheck={false}
        placeholderTextColorClassName="accent-foreground/20"
        accessibilityLabel={label}
        // Android: плейсхолдер и текст выравниваются по-разному, пока line-height ≠ высоте
        // поля — плейсхолдер прыгает при вводе. Центрируем явно и убираем font padding.
        textAlignVertical="center"
        style={{ includeFontPadding: false }}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
        className={cn(
          'font-display text-foreground w-full p-0 uppercase',
          // line-height = высоте поля: цифра и плейсхолдер центрируются одинаково (font padding выключен)
          large ? 'h-14 text-[40px] leading-[56px]' : 'h-10 text-[28px] leading-[40px]',
        )}
      />
    </View>
  );
};
