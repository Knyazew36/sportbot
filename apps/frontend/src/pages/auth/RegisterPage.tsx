import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'

import { useRegister } from '@/entities/session'
import { getApiErrorMessage } from '@/shared/api'
import { type AuthLocationState, ROUTES } from '@/shared/config/paths'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { TextField } from '@/shared/ui/kit/TextField'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { emailSchema, newPasswordSchema } from './model/schemas'
import { AuthLayout, AuthLink } from './ui/AuthLayout'

const schema = z.object({
  name: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  email: emailSchema,
  password: newPasswordSchema,
})

type FormValues = z.infer<typeof schema>

const RegisterPage = () => {
  const navigate = useNavigate()
  const state = useLocation().state as AuthLocationState | null
  const registration = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(({ name, lastName, ...credentials }) =>
    registration.mutate(
      // Пустые необязательные поля не отправляем: сервер ждёт либо строку, либо отсутствие ключа
      { ...credentials, ...(name && { name }), ...(lastName && { lastName }) },
      {
        // Токен выдаётся только после подтверждения почты — дальше ввод кода из письма
        onSuccess: ({ email }) => {
          const next: AuthLocationState = { ...state, email }
          navigate(ROUTES.VERIFY_EMAIL, { state: next })
        },
      },
    ),
  )

  return (
    <AuthLayout
      title='Регистрация'
      footer={
        <span>
          Уже есть аккаунт?{' '}
          <Link
            to={ROUTES.LOGIN}
            state={state}
          >
            <AuthLink>Войти</AuthLink>
          </Link>
        </span>
      }
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className='flex flex-col gap-4'
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <TextField
            label='Имя'
            autoComplete='given-name'
            error={errors.name}
            {...register('name')}
          />
          <TextField
            label='Фамилия'
            autoComplete='family-name'
            error={errors.lastName}
            {...register('lastName')}
          />
        </div>
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
          autoComplete='new-password'
          description='Не короче 8 символов'
          error={errors.password}
          {...register('password')}
        />
        {registration.isError && <ErrorText>{getApiErrorMessage(registration.error)}</ErrorText>}
        <Button
          type='submit'
          disabled={registration.isPending}
        >
          Создать аккаунт
        </Button>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage
