import { Field, FieldError, FieldLabel } from '@/shared/ui/shadcn/field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/shadcn/input-otp'

import { CODE_LENGTH } from '../model/schemas'

type CodeFieldProps = {
  value: string
  onChange: (value: string) => void
  error?: { message?: string }
}

// 6-значный код из письма: подтверждение почты и сброс пароля
export const CodeField = ({ value, onChange, error }: CodeFieldProps) => (
  <Field data-invalid={!!error}>
    <FieldLabel htmlFor='code'>Код из письма</FieldLabel>
    <InputOTP
      id='code'
      maxLength={CODE_LENGTH}
      inputMode='numeric'
      autoComplete='one-time-code'
      value={value}
      onChange={onChange}
      aria-invalid={!!error}
    >
      <InputOTPGroup>
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
    <FieldError errors={[error]} />
  </Field>
)
