import { Field, FieldError, FieldLabel } from '@/shared/ui/shadcn/field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/shadcn/input-otp'

type CodeFieldProps = {
  value: string
  onChange: (value: string) => void
  error?: { message?: string }
  /** Число цифр в коде */
  length: number
}

// 6-значный код из письма: подтверждение почты и сброс пароля
export const CodeField = ({ value, onChange, error, length }: CodeFieldProps) => (
  <Field data-invalid={!!error}>
    <FieldLabel htmlFor='code'>Код из письма</FieldLabel>
    <InputOTP
      id='code'
      maxLength={length}
      inputMode='numeric'
      autoComplete='one-time-code'
      value={value}
      onChange={onChange}
      aria-invalid={!!error}
    >
      <InputOTPGroup>
        {Array.from({ length: length }, (_, index) => (
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
