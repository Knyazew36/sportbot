import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  type Me,
  useChangePassword,
  useDeleteAccount,
  useMe,
  useUpdateProfile,
  useUploadAvatar,
} from '@/entities/session'
import { toAssetUrl } from '@/shared/api'
import { displayName } from '@/shared/lib/format'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { PageHeader } from '@/shared/ui/kit/PageHeader'
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar'
import { SectionCard } from '@/shared/ui/kit/Section'
import { TextField } from '@/shared/ui/kit/TextField'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// ── Профиль ─────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().trim().max(100),
  lastName: z.string().trim().max(100),
  phone: z.union([z.literal(''), z.string().regex(/^[+\d][\d\s()-]{9,}$/, 'Некорректный телефон')]),
})

const ProfileForm = ({ me }: { me: Me }) => {
  const update = useUpdateProfile()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: me.name ?? '', lastName: me.lastName ?? '', phone: me.phone ?? '' },
  })

  const onSubmit = handleSubmit(({ phone, ...values }) =>
    update.mutate(
      // Пустой телефон не отправляем: сервер валидирует формат у любой переданной строки
      { ...values, ...(phone && { phone }) },
      {
        onSuccess: saved => {
          reset({ name: saved.name ?? '', lastName: saved.lastName ?? '', phone: saved.phone ?? '' })
          notifySuccess('Профиль сохранён')()
        },
        onError: notifyError,
      },
    ),
  )

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className='flex max-w-md flex-col gap-4'
    >
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
      <TextField
        label='Телефон'
        type='tel'
        error={errors.phone}
        {...register('phone')}
      />
      <Button
        type='submit'
        className='self-start'
        disabled={!isDirty || update.isPending}
      >
        Сохранить
      </Button>
    </form>
  )
}

const AvatarForm = ({ me }: { me: Me }) => {
  const upload = useUploadAvatar()

  return (
    <div className='flex items-center gap-4'>
      <PersonAvatar
        name={displayName(me)}
        src={toAssetUrl(me.avatarUrl)}
        size='xl'
        tone='accent'
      />
      <label className='cursor-pointer'>
        <span className='mono-label bg-mist hover:bg-ash/50 rounded-full px-3 py-2'>
          {upload.isPending ? 'Загрузка…' : 'Сменить фото'}
        </span>
        <input
          type='file'
          accept='image/*'
          className='sr-only'
          disabled={upload.isPending}
          onChange={event => {
            const file = event.target.files?.[0]
            if (file) upload.mutate(file, { onSuccess: notifySuccess('Фото обновлено'), onError: notifyError })
            event.target.value = ''
          }}
        />
      </label>
    </div>
  )
}

// ── Безопасность ────────────────────────────────────────────────────────────

const passwordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z
    .string()
    .min(8, 'Пароль должен быть не короче 8 символов')
    .max(72, 'Пароль должен быть не длиннее 72 символов')
    .regex(/\S/, 'Пароль не может состоять только из пробелов'),
})

const PasswordForm = () => {
  const change = useChangePassword()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  })

  const onSubmit = handleSubmit(({ currentPassword, newPassword }) =>
    change.mutate(
      // Вошедшие через мессенджер могут не иметь пароля — тогда текущий не передаём
      { newPassword, ...(currentPassword && { currentPassword }) },
      {
        onSuccess: () => {
          reset()
          notifySuccess('Пароль изменён, другие сеансы завершены')()
        },
        onError: notifyError,
      },
    ),
  )

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className='flex max-w-md flex-col gap-4'
    >
      <TextField
        label='Текущий пароль'
        type='password'
        autoComplete='current-password'
        description='Оставьте пустым, если пароль ещё не задан'
        error={errors.currentPassword}
        {...register('currentPassword')}
      />
      <TextField
        label='Новый пароль'
        type='password'
        autoComplete='new-password'
        error={errors.newPassword}
        {...register('newPassword')}
      />
      <Button
        type='submit'
        className='self-start'
        disabled={change.isPending}
      >
        Сменить пароль
      </Button>
    </form>
  )
}

const DeleteAccount = () => {
  const remove = useDeleteAccount()
  const { register, getValues } = useForm({ defaultValues: { currentPassword: '' } })

  return (
    <div className='flex max-w-md flex-col gap-4'>
      <p className='text-body-sm text-slate'>
        Аккаунт удаляется безвозвратно вместе с организациями, которыми вы владеете.
      </p>
      <TextField
        label='Текущий пароль'
        type='password'
        autoComplete='current-password'
        description='Нужен, если пароль задан'
        {...register('currentPassword')}
      />
      <ConfirmAction
        trigger={
          <Button
            variant='destructive'
            className='self-start'
          />
        }
        title='Удалить аккаунт?'
        description='Это действие нельзя отменить.'
        confirmLabel='Удалить навсегда'
        onConfirm={() => {
          const currentPassword = getValues('currentPassword')
          // Слово-подтверждение сервер требует как защиту от случайного вызова — его даёт диалог выше
          return remove.mutateAsync(
            { confirmation: 'удалить', ...(currentPassword && { currentPassword }) },
            { onError: notifyError },
          )
        }}
      >
        Удалить аккаунт
      </ConfirmAction>
    </div>
  )
}

const ProfilePage = () => {
  // PrivateRoute не пускает сюда без загруженного профиля
  const { data: me } = useMe()
  if (!me) return null

  return (
    <div className='flex flex-col gap-8'>
      <PageHeader
        eyebrow={me.email ?? undefined}
        title='Профиль'
      />
      <SectionCard title='Личные данные'>
        <div className='flex flex-col gap-6'>
          <AvatarForm me={me} />
          <ProfileForm me={me} />
        </div>
      </SectionCard>
      <SectionCard title='Пароль'>
        <PasswordForm />
      </SectionCard>
      <SectionCard title='Удаление аккаунта'>
        <DeleteAccount />
      </SectionCard>
    </div>
  )
}

export default ProfilePage
