import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { View } from 'react-native';
import { OTPInput } from 'input-otp-native';

import { cn } from '@/shared/lib/utils';

import { ErrorText } from './ErrorText';
import { Text } from './Typography';

type CodeFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  /** Число цифр в коде */
  length: number;
  error?: { message?: string };
};

// 6-значный код из письма: подтверждение почты и сброс пароля — порт shared/ui/kit/CodeField.tsx
export const CodeField = <T extends FieldValues>({ control, name, length, error }: CodeFieldProps<T>) => (
  <View className="gap-1.5">
    <Text size="sm" tone="soft">
      Код из письма
    </Text>
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <OTPInput
          value={value ?? ''}
          onChange={onChange}
          maxLength={length}
          inputMode="numeric"
          autoComplete="one-time-code"
          render={({ slots }) => (
            <View className="flex-row gap-2">
              {slots.map((slot, index) => (
                <View
                  key={index}
                  className={cn(
                    'bg-background h-[52px] w-11 items-center justify-center border-[1.5px]',
                    error ? 'border-destructive' : slot.isActive || slot.char ? 'border-primary' : 'border-input',
                  )}
                >
                  <Text className="font-mono text-[20px] leading-[24px]">{slot.char ?? ''}</Text>
                </View>
              ))}
            </View>
          )}
        />
      )}
    />
    <ErrorText errors={error} />
  </View>
);
