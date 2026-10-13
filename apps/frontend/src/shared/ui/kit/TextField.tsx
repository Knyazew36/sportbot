import { useId } from 'react'

import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/shadcn/field'
import { Input } from '@/shared/ui/shadcn/input'

type TextFieldProps = React.ComponentProps<typeof Input> & {
  label: string
  description?: React.ReactNode
  /** Ошибка поля из react-hook-form: formState.errors.<name> */
  error?: { message?: string }
}

// Поле формы целиком: подпись, инпут, подсказка, ошибка — со связями для скринридера.
// Использование: <TextField label="Email" error={errors.email} {...register('email')} />
export const TextField = ({ label, description, error, id, ...props }: TextFieldProps) => {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError
        id={errorId}
        errors={[error]}
      />
    </Field>
  )
}
