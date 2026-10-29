import type { ComponentProps, ComponentRef, Ref } from 'react';
import { Platform, TextInput, type TextInputProps } from 'react-native';
import { BottomSheetTextInput, useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { withUniwind } from 'uniwind';

// Классы до BottomSheetTextInput доходят только через withUniwind: он не из react-native
const SheetTextInput = withUniwind(BottomSheetTextInput, {
  style: { fromClassName: 'className' },
  placeholderTextColor: { fromClassName: 'placeholderTextColorClassName', styleProperty: 'accentColor' },
  cursorColor: { fromClassName: 'cursorColorClassName', styleProperty: 'accentColor' },
  selectionColor: { fromClassName: 'selectionColorClassName', styleProperty: 'accentColor' },
  selectionHandleColor: { fromClassName: 'selectionHandleColorClassName', styleProperty: 'accentColor' },
});

type KitTextInputProps = TextInputProps & {
  className?: string;
  placeholderTextColorClassName?: string;
  cursorColorClassName?: string;
  selectionColorClassName?: string;
  selectionHandleColorClassName?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

// Сырой ввод для полей kit. Внутри шторки — BottomSheetTextInput: только его фокус поднимает шторку над
// клавиатурой, с обычным TextInput поле остаётся под ней.
// Каретка и выделение в цвет темы: системные (зелёный Android, синий iOS) выбиваются из палитры
export const KitTextInput = ({
  cursorColorClassName = 'accent-primary',
  // iOS красит selectionColor и каретку (cursorColor там нет) — прозрачность её спрячет;
  // на Android это заливка под выделенным текстом, сплошной цвет скроет буквы
  selectionColorClassName = Platform.OS === 'ios' ? 'accent-primary' : 'accent-primary/30',
  selectionHandleColorClassName = 'accent-primary',
  ...rest
}: KitTextInputProps) => {
  const props = { cursorColorClassName, selectionColorClassName, selectionHandleColorClassName, ...rest };
  const inSheet = useBottomSheetInternal(true) !== null;
  // У BottomSheetTextInput свой тип ref, но под ним тот же нативный TextInput
  return inSheet ? (
    <SheetTextInput {...(props as ComponentProps<typeof SheetTextInput>)} />
  ) : (
    <TextInput {...props} />
  );
};
