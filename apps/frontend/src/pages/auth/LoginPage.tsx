import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'

import { useLogin } from '@/entities/session'
import { getApiErrorMessage, getApiErrorStatus } from '@/shared/api'
import { type AuthLocationState, ROUTES } from '@/shared/config/paths'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { TextField } from '@/shared/ui/kit/TextField'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { emailSchema } from './model/schemas'
import { AuthLayout, AuthLink } from './ui/AuthLayout'

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Введите пароль'),
})

type FormValues = z.infer<typeof schema>

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as AuthLocationState | null
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: state?.email ?? '' } })

  // После успеха токен сохранён — GuestRoute сам уводит туда, откуда пользователь пришёл
  const onSubmit = handleSubmit(values =>
    login.mutate(values, {
      onError: error => {
        // 403 — почта не подтверждена: сервер уже выслал новый код, ведём на его ввод
        if (getApiErrorStatus(error) === 403) {
          const next: AuthLocationState = { ...state, email: values.email }
          navigate(ROUTES.VERIFY_EMAIL, { state: next })
        }
      },
    }),
  )

  return (
    <AuthLayout
      title='Вход'
      footer={
        <>
          <span>
            Нет аккаунта?{' '}
            <Link
              to={ROUTES.REGISTER}
              state={state}
            >
              <AuthLink>Зарегистрироваться</AuthLink>
            </Link>
          </span>
          <Link to={ROUTES.FORGOT_PASSWORD}>
            <AuthLink>Забыли пароль?</AuthLink>
          </Link>
        </>
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
        <TextField
          label='Пароль'
          type='password'
          autoComplete='current-password'
          error={errors.password}
          {...register('password')}
        />
        {login.isError && <ErrorText>{getApiErrorMessage(login.error)}</ErrorText>}
        <Button
          type='submit'
          disabled={login.isPending}
        >
          Войти
        </Button>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
