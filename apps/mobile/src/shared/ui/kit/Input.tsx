import type { ComponentRef, Ref } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { cn } from '@/shared/lib/utils';

import { KitTextInput } from './KitTextInput';

export type InputRef = ComponentRef<typeof TextInput>;

type InputProps = TextInputProps & { className?: string; invalid?: boolean; ref?: Ref<InputRef> };

// Инпут — Input из React Native Reusables со стилем shared/ui/shadcn/input фронта: рамка 1.5, без скруглений
export const Input = ({ className, invalid, editable, ...props }: InputProps) => (
  <KitTextInput
    placeholderTextColorClassName="accent-smoke"
    aria-invalid={invalid}
    editable={editable}
    {...props}
    className={cn(
      'bg-background text-foreground font-sans h-12 w-full border-[1.5px] px-3.5 text-[16px] tracking-[-0.32px]',
      invalid ? 'border-destructive' : 'border-input',
      editable === false && 'opacity-50',
      className,
    )}
  />
);
