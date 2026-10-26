import type { ComponentProps, ComponentRef, Ref } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { BottomSheetTextInput, useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { withUniwind } from 'uniwind';

// Классы до BottomSheetTextInput доходят только через withUniwind: он не из react-native
const SheetTextInput = withUniwind(BottomSheetTextInput, {
  style: { fromClassName: 'className' },
  placeholderTextColor: { fromClassName: 'placeholderTextColorClassName', styleProperty: 'accentColor' },
});

type KitTextInputProps = TextInputProps & {
  className?: string;
  placeholderTextColorClassName?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

// Сырой ввод для полей kit. Внутри шторки — BottomSheetTextInput: только его фокус поднимает шторку над
// клавиатурой, с обычным TextInput поле остаётся под ней
export const KitTextInput = (props: KitTextInputProps) => {
  const inSheet = useBottomSheetInternal(true) !== null;
  // У BottomSheetTextInput свой тип ref, но под ним тот же нативный TextInput
  return inSheet ? (
    <SheetTextInput {...(props as ComponentProps<typeof SheetTextInput>)} />
  ) : (
    <TextInput {...props} />
  );
};
