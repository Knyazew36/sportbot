import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'

import { getApiErrorMessage } from '@/shared/api'
import { type AuthLocationState, ROUTES } from '@/shared/config/paths'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { TextField } from '@/shared/ui/kit/TextField'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { useForgotPassword, forgotPasswordSchema, type ForgotPasswordValues } from '@sportbot/api/entities/session'
import { LayoutAuth, AuthLink } from '@/shared/layouts/layout-auth/LayoutAuth'



const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const forgot = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = handleSubmit(({ email }) =>
    forgot.mutate(email, {
      // Сервер отвечает одинаково для существующего и несуществующего email — сразу ведём на ввод кода
      onSuccess: () => {
        const next: AuthLocationState = { email }
        navigate(ROUTES.RESET_PASSWORD, { state: next })
      },
    }),
  )

  return (
    <LayoutAuth
      title='Сброс пароля'
      description='Укажите email аккаунта — пришлём код для смены пароля.'
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
          error={errors.email}
          {...register('email')}
        />
        {forgot.isError && <ErrorText>{getApiErrorMessage(forgot.error)}</ErrorText>}
        <Button
          type='submit'
          disabled={forgot.isPending}
        >
          Получить код
        </Button>
      </form>
    </LayoutAuth>
  )
}

export default ForgotPasswordPage
