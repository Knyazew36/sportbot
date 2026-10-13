import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router'
import { z } from 'zod'

import { useResendVerification, useVerifyEmail } from '@/entities/session'
import { getApiErrorMessage } from '@/shared/api'
import { type AuthLocationState, ROUTES } from '@/shared/config/paths'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { TextField } from '@/shared/ui/kit/TextField'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { toast } from '@/shared/ui/shadcn/toast'

import { codeSchema, emailSchema } from './model/schemas'
import { AuthLayout, AuthLink } from './ui/AuthLayout'
import { CodeField } from './ui/CodeField'

const schema = z.object({ email: emailSchema, code: codeSchema })

type FormValues = z.infer<typeof schema>

const VerifyEmailPage = () => {
  const state = useLocation().state as AuthLocationState | null
  const verify = useVerifyEmail()
  const resend = useResendVerification()

  const {
    register,
    control,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: state?.email ?? '', code: '' } })

  // После успеха токен сохранён — GuestRoute уводит на state.from или на главную
  const onSubmit = handleSubmit(values => verify.mutate(values))

  const onResend = async () => {
    if (!(await trigger('email'))) return
    resend.mutate(getValues('email'), {
      onSuccess: ({ message }) => toast.add({ title: message, type: 'success' }),
      onError: error => toast.add({ title: getApiErrorMessage(error), type: 'error' }),
    })
  }

  return (
    <AuthLayout
      title='Подтверждение почты'
      description='Мы отправили письмо с 6-значным кодом. Введите его, чтобы войти.'
      footer={
        <Link to={ROUTES.LOGIN}>
          <AuthLink>Вернуться ко входу</AuthLink>
        </Link>
      }
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className='flex flex-col gap-4'
      >
        {/* Email известен после регистрации или входа; при прямом заходе на страницу его нужно ввести */}
        <TextField
          label='Email'
          type='email'
          autoComplete='email'
          readOnly={!!state?.email}
          error={errors.email}
          {...register('email')}
        />
        <Controller
          control={control}
          name='code'
          render={({ field }) => (
            <CodeField
              value={field.value}
              onChange={field.onChange}
              error={errors.code}
            />
          )}
        />
        {verify.isError && <ErrorText>{getApiErrorMessage(verify.error)}</ErrorText>}
        <Button
          type='submit'
          disabled={verify.isPending}
        >
          Подтвердить
        </Button>
        <Button
          type='button'
          variant='ghost'
          disabled={resend.isPending}
          onClick={onResend}
        >
          Отправить код ещё раз
        </Button>
      </form>
    </AuthLayout>
  )
}

export default VerifyEmailPage
