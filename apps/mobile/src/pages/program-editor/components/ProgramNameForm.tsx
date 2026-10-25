import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { type Program, programNameSchema, type ProgramNameValues, useRenameProgram } from '@sportbot/api/entities/program';

import { applyFieldErrors } from '@/shared/lib/form';
import { TextField } from '@/shared/ui/kit/TextField';

// Название программы: сохраняется, когда поле теряет фокус или нажали «Готово» на клавиатуре
export const ProgramNameForm = ({ program }: { program: Program }) => {
  const rename = useRenameProgram();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProgramNameValues>({
    resolver: zodResolver(programNameSchema),
    values: { name: program.name },
  });

  const save = handleSubmit(({ name }) => {
    if (name === program.name) return;
    return rename.mutateAsync({ id: program.id, name }).catch((error) => applyFieldErrors(error, setError));
  });

  return (
    <Controller
      control={control}
      name="name"
      render={({ field }) => (
        <TextField
          label="Название программы"
          placeholder="Например, «Сила. Сплит на 3 дня»"
          description={
            program.publication === 'PUBLISHED' ? 'Новое название попадёт в каталог после проверки' : undefined
          }
          error={errors.name}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={() => {
            field.onBlur();
            void save();
          }}
          onSubmitEditing={() => void save()}
          returnKeyType="done"
        />
      )}
    />
  );
};
