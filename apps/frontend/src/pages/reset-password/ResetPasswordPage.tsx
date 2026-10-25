import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'

import { CODE_LENGTH, useResetPassword, resetPasswordSchema, type ResetPasswordValues } from '@sportbot/api/entities/session'
import { getApiErrorMessage } from '@/shared/api'
import { type AuthLocationState, ROUTES } from '@/shared/config/paths'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { TextField } from '@/shared/ui/kit/TextField'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { toast } from '@/shared/ui/shadcn/toast'

import { LayoutAuth, AuthLink } from '@/shared/layouts/layout-auth/LayoutAuth'
import { CodeField } from '@/shared/ui/kit/CodeField'



const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const state = useLocation().state as AuthLocationState | null
  const reset = useResetPassword()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: state?.email ?? '', code: '', newPassword: '' },
  })

  const onSubmit = handleSubmit(values =>
    reset.mutate(values, {
      // Сброс пароля токен не выдаёт — входим заново уже с новым паролем
      onSuccess: ({ message }) => {
        toast.add({ title: message, type: 'success' })
        const next: AuthLocationState = { email: values.email }
        navigate(ROUTES.LOGIN, { state: next })
      },
    }),
  )

  return (
    <LayoutAuth
      title='Новый пароль'
      description='Введите код из письма и придумайте новый пароль.'
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
              length={CODE_LENGTH}
              value={field.value}
              onChange={field.onChange}
              error={errors.code}
            />
          )}
        />
        <TextField
          label='Новый пароль'
          type='password'
          autoComplete='new-password'
          description='Не короче 8 символов'
          error={errors.newPassword}
          {...register('newPassword')}
        />
        {reset.isError && <ErrorText>{getApiErrorMessage(reset.error)}</ErrorText>}
        <Button
          type='submit'
          disabled={reset.isPending}
        >
          Сменить пароль
        </Button>
      </form>
    </LayoutAuth>
  )
}

export default ResetPasswordPage
