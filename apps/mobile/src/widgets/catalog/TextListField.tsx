import { View } from 'react-native';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, X } from 'lucide-react-native';

import { TEXT_LIST_MAX, type TextListInput } from '@sportbot/api/entities/catalog';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Icon } from '@/shared/ui/kit/Icon';
import { Input } from '@/shared/ui/kit/Input';
import { Poster, Text } from '@/shared/ui/kit/Typography';

type ListForm = { steps: TextListInput; mistakes: TextListInput };

type TextListFieldProps = {
  name: keyof ListForm;
  label: string;
  placeholder: string;
  addLabel: string;
};

// Шаги или ошибки записи — порт widgets/catalog/TextListField.tsx: каждый пункт — отдельное поле,
// поэтому разбирать текст не нужно
export const TextListField = ({ name, label, placeholder, addLabel }: TextListFieldProps) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<ListForm>();
  const { fields, append, remove } = useFieldArray({ control, name });
  const listErrors = errors[name];

  return (
    <View className="gap-2">
      <Text size="sm" tone="soft">
        {label}
      </Text>
      {fields.map((field, i) => (
        <View key={field.id} className="flex-row items-start gap-2">
          <Poster size="sm" tone="primary" numeric className="w-6 pt-3">
            {String(i + 1)}
          </Poster>
          <View className="min-w-0 flex-1 gap-1">
            <Controller
              control={control}
              name={`${name}.${i}.value`}
              render={({ field: input }) => (
                <Input
                  multiline
                  textAlignVertical="top"
                  placeholder={placeholder}
                  accessibilityLabel={`${label}: пункт ${i + 1}`}
                  invalid={!!listErrors?.[i]?.value}
                  value={input.value}
                  onChangeText={input.onChange}
                  onBlur={input.onBlur}
                  className="h-auto min-h-12 py-3"
                />
              )}
            />
            <ErrorText errors={listErrors?.[i]?.value} />
          </View>
          <Button
            variant="outline"
            size="icon-sm"
            className="mt-1.5"
            accessibilityLabel={`Убрать пункт ${i + 1}`}
            onPress={() => remove(i)}
          >
            <Icon as={X} strokeWidth={2.5} className="size-4" />
          </Button>
        </View>
      ))}
      <ErrorText errors={listErrors?.root ?? listErrors} />
      <Button
        variant="outline"
        size="sm"
        icon={Plus}
        disabled={fields.length >= TEXT_LIST_MAX}
        onPress={() => append({ value: '' })}
      >
        {addLabel}
      </Button>
    </View>
  );
};
